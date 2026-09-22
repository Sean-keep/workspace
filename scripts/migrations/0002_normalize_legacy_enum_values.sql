-- Normalize legacy enum-ish columns.
--
-- Rows written before the name→value switch stored Python member names
-- ('HIGH', 'NOTE', 'TODO'). The app now reads member values ('high', 'note',
-- 'todo') and MySQL's tasks.priority was a native ENUM('LOW','MEDIUM',...)
-- which can't even accept the new values. Convert it to VARCHAR (what
-- scripts/init.sql declares) and fold every name form down to its value.
--
-- Safe to re-run. Custom task statuses (custom_*) are left untouched.

USE personal_workspace;

-- 1) tasks.priority: native ENUM('LOW','MEDIUM','HIGH','URGENT') → VARCHAR
ALTER TABLE tasks MODIFY priority VARCHAR(20) NOT NULL DEFAULT 'medium';

-- 2) priority / recurrence_type / note_type: name form → value form
UPDATE tasks SET priority = LOWER(priority)
 WHERE priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

UPDATE tasks SET recurrence_type = CASE UPPER(recurrence_type)
    WHEN 'NONE' THEN 'none'
    WHEN 'DAILY' THEN 'daily'
    WHEN 'WEEKDAYS' THEN 'weekdays'
    WHEN 'WEEKLY' THEN 'weekly'
    WHEN 'MONTHLY' THEN 'monthly'
    WHEN 'CUSTOM' THEN 'custom'
    ELSE recurrence_type
  END
 WHERE UPPER(recurrence_type) IN ('NONE','DAILY','WEEKDAYS','WEEKLY','MONTHLY','CUSTOM');

UPDATE notes SET note_type = CASE UPPER(note_type)
    WHEN 'NOTE' THEN 'note'
    WHEN 'CHECKLIST' THEN 'checklist'
    ELSE note_type
  END
 WHERE UPPER(note_type) IN ('NOTE', 'CHECKLIST');

-- 3) status is free-form (custom_*) so only fold the known built-ins
UPDATE tasks SET status = CASE UPPER(status)
    WHEN 'TODO' THEN 'todo'
    WHEN 'IN_PROGRESS' THEN 'in_progress'
    WHEN 'IN PROGRESS' THEN 'in_progress'
    WHEN 'DONE' THEN 'done'
    WHEN 'COMPLETED' THEN 'done'
    ELSE status
  END
 WHERE UPPER(status) IN ('TODO','IN_PROGRESS','IN PROGRESS','DONE','COMPLETED');
