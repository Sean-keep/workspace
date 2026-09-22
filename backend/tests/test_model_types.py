"""SafeEnum must accept legacy name-form rows ('HIGH') as well as values ('high')."""

import pytest

from app.models.task import RecurrenceType, TaskPriority
from app.models.note import NoteType
from app.models.types import SafeEnum


@pytest.mark.parametrize(
    "enum_cls, raw, expected",
    [
        (TaskPriority, "high", TaskPriority.HIGH),
        (TaskPriority, "HIGH", TaskPriority.HIGH),
        (TaskPriority, "High", TaskPriority.HIGH),
        (TaskPriority, TaskPriority.LOW, TaskPriority.LOW),
        (RecurrenceType, "NONE", RecurrenceType.NONE),
        (RecurrenceType, "weekdays", RecurrenceType.WEEKDAYS),
        (NoteType, "NOTE", NoteType.NOTE),
        (NoteType, "checklist", NoteType.CHECKLIST),
    ],
)
def test_safe_enum_accepts_name_value_and_case(enum_cls, raw, expected):
    col = SafeEnum(enum_cls)
    assert col.process_result_value(raw, None) is expected
    # Round-trip: whatever we bind comes back as the canonical value.
    assert col.process_bind_param(raw, None) == expected.value


def test_safe_enum_passes_none_through():
    col = SafeEnum(TaskPriority)
    assert col.process_bind_param(None, None) is None
    assert col.process_result_value(None, None) is None


def test_safe_enum_rejects_unknown():
    col = SafeEnum(TaskPriority)
    with pytest.raises(LookupError):
        col.process_result_value("nope", None)
