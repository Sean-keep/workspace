"""Unit tests for utils.recurring.should_reset_recurring_task."""
from datetime import datetime, timedelta, timezone

from app.models.task import RecurrenceType, Task
from app.utils.recurring import should_reset_recurring_task

MONDAY = datetime(2026, 9, 21).date()     # weekday 0
TUESDAY = datetime(2026, 9, 22).date()    # weekday 1
SATURDAY = datetime(2026, 9, 26).date()   # weekday 5


def _task(**kwargs):
    defaults = {
        "is_recurring": True,
        "recurrence_type": RecurrenceType.DAILY,
        "status": "done",
        "last_completed": datetime(2026, 9, 20, 12, 0, 0),
    }
    defaults.update(kwargs)
    return Task(**defaults)


def test_non_recurring_never_resets():
    t = _task(is_recurring=False)
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_recurrence_none_never_resets():
    t = _task(recurrence_type=RecurrenceType.NONE)
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_daily_resets_after_a_day():
    t = _task(recurrence_type=RecurrenceType.DAILY)
    assert should_reset_recurring_task(t, today=TUESDAY) is True


def test_daily_same_day_no_reset():
    t = _task(recurrence_type=RecurrenceType.DAILY, last_completed=datetime(2026, 9, 22, 8, 0, 0))
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_daily_missing_last_completed_resets_if_done():
    t = _task(recurrence_type=RecurrenceType.DAILY, last_completed=None, status="done")
    assert should_reset_recurring_task(t, today=TUESDAY) is True


def test_daily_missing_last_completed_keeps_todo():
    t = _task(recurrence_type=RecurrenceType.DAILY, last_completed=None, status="todo")
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_weekdays_resets_on_monday():
    # Completed Sunday the 20th; Monday the 21st is a weekday -> reset.
    t = _task(recurrence_type=RecurrenceType.WEEKDAYS, last_completed=datetime(2026, 9, 20, 9, 0, 0))
    assert should_reset_recurring_task(t, today=MONDAY) is True


def test_weekdays_skips_weekend():
    t = _task(recurrence_type=RecurrenceType.WEEKDAYS, last_completed=datetime(2026, 9, 25, 9, 0, 0))
    assert should_reset_recurring_task(t, today=SATURDAY) is False


def test_weekly_resets_on_same_weekday():
    # Completed Monday the 14th; Monday the 21st is one week later.
    t = _task(recurrence_type=RecurrenceType.WEEKLY, last_completed=datetime(2026, 9, 14, 9, 0, 0))
    assert should_reset_recurring_task(t, today=MONDAY) is True


def test_weekly_other_weekday_no_reset():
    t = _task(recurrence_type=RecurrenceType.WEEKLY, last_completed=datetime(2026, 9, 14, 9, 0, 0))
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_monthly_resets_on_same_day_of_month():
    # Completed Aug 21; Sep 21 is the same day-of-month.
    t = _task(recurrence_type=RecurrenceType.MONTHLY, last_completed=datetime(2026, 8, 21, 9, 0, 0))
    assert should_reset_recurring_task(t, today=MONDAY) is True


def test_monthly_other_day_no_reset():
    t = _task(recurrence_type=RecurrenceType.MONTHLY, last_completed=datetime(2026, 8, 21, 9, 0, 0))
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_custom_resets_on_listed_weekday():
    # recurrence_days = [0, 2] -> Monday(0) and Wednesday(2)
    t = _task(
        recurrence_type=RecurrenceType.CUSTOM,
        recurrence_days=[0, 2],
        last_completed=datetime(2026, 9, 20, 9, 0, 0),
    )
    assert should_reset_recurring_task(t, today=MONDAY) is True
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_custom_without_days_never_resets():
    t = _task(recurrence_type=RecurrenceType.CUSTOM, recurrence_days=None)
    assert should_reset_recurring_task(t, today=TUESDAY) is False


def test_aware_last_completed_is_compared_in_utc():
    # 20:00 UTC-5 == 01:00 UTC next day -> still "yesterday" relative to today
    aware = datetime(2026, 9, 21, 20, 0, 0, tzinfo=timezone(timedelta(hours=-5)))
    t = _task(recurrence_type=RecurrenceType.DAILY, last_completed=aware)
    # aware is 2026-09-22 01:00 UTC -> date is today (TUESDAY) -> no reset
    assert should_reset_recurring_task(t, today=TUESDAY) is False
