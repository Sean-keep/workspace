import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .config import settings
from .database import Base, SessionLocal, engine
from .api import api_router
from .utils.response import error_response

logger = logging.getLogger("workspace")

RECURRING_RESET_INTERVAL = 3600  # seconds


def _bootstrap_admin() -> None:
    """Create the initial admin account when the users table is empty."""
    from .models.user import User
    from .utils.security import get_password_hash

    db = SessionLocal()
    try:
        if db.query(User).first() is not None:
            return
        db.add(
            User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            )
        )
        db.commit()
        logger.warning(
            "Created bootstrap admin user '%s' — change its password immediately.",
            settings.ADMIN_USERNAME,
        )
    finally:
        db.close()


async def _recurring_reset_loop() -> None:
    from .utils.recurring import reset_recurring_tasks

    while True:
        try:
            db = SessionLocal()
            try:
                reset_recurring_tasks(db)
            finally:
                db.close()
        except Exception:
            logger.exception("Recurring task reset failed")
        await asyncio.sleep(RECURRING_RESET_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_secret_ephemeral:
        logger.warning(
            "SECRET_KEY is not set — using an ephemeral key. "
            "All tokens will be invalidated on restart. Set SECRET_KEY in .env."
        )
    # Schema is owned by Alembic; create_all/bootstrap only ease a first local
    # boot. A missing DB must not keep the process from starting — /health
    # reports the degraded state and the recurring loop retries every hour.
    try:
        Base.metadata.create_all(bind=engine)
        _bootstrap_admin()
    except Exception:
        logger.exception("Startup DB init failed — is the database reachable?")
    task = asyncio.create_task(_recurring_reset_loop())
    yield
    task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(message=str(exc.detail), code=exc.status_code),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=error_response(message="Validation error", code=422, data=exc.errors()),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=error_response(message="Internal server error", code=500),
    )


# CORS — origins come from the environment, never "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "healthy" if db_status == "ok" else "degraded", "database": db_status}
