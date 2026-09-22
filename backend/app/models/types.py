"""SQLAlchemy column types."""

from sqlalchemy import String, TypeDecorator


class SafeEnum(TypeDecorator):
    """Enum stored as VARCHAR, tolerant of legacy rows.

    The schema uses plain VARCHAR (see scripts/init.sql) so custom values stay
    possible and MySQL never rejects a rename. On the way in/out we accept the
    member value ('high'), the member name ('HIGH'), or any case variant —
    rows written before the value/name switch used the name form and used to
    blow up reads with LookupError.
    """

    impl = String
    cache_ok = True

    def __init__(self, enum_cls, length: int = 20):
        self.enum_cls = enum_cls
        super().__init__(length=length)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return self._coerce(value).value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return self._coerce(value)

    def _coerce(self, value):
        cls = self.enum_cls
        if isinstance(value, cls):
            return value

        text = str(value)
        lowered = text.lower()
        for member in cls:
            if member.value == text or member.name == text:
                return member
        for member in cls:
            if member.value == lowered or member.name.lower() == lowered:
                return member

        raise LookupError(
            f"{value!r} is not among the defined enum values. "
            f"Enum name: {cls.__name__.lower()}. "
            f"Possible values: {', '.join(m.value for m in cls)}"
        )

    def copy(self, **kw):
        return SafeEnum(self.enum_cls, length=self.impl.length)
