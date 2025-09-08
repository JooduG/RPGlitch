# MCP Rule: Time Management

This rule defines how the agent must handle and represent time and dates.

**Core Principle:** All timestamps in filenames, logs, and metadata must strictly adhere to the ISO 8601 format to ensure universal consistency and machine-readability.

---

## 1. The Standard Format: ISO 8601

The required format is `YYYY-MM-DDTHH:mm:ssZ`.

- **`YYYY-MM-DD`**: The full year, month, and day.
- **`T`**: A literal character 'T' separating the date from the time.
- **`HH:mm:ss`**: The full hours, minutes, and seconds, in 24-hour format.
- **`Z`**: The UTC (Zulu) timezone designator. All timestamps must be in UTC to avoid ambiguity.

**Example:** `2025-08-31T01:58:00Z`

This is the standard format used in Sweden and internationally, making it ideal for this project.

## 2. Usage

### Filenames and Directories

When creating timestamped directories or files, especially in `/memory-bank/past/`, use a simplified but still compliant version of the format.

- **Example Directory Name:** `2025-08-31T015800Z` (colons are often problematic in filenames).

### In-File Timestamps

When writing a timestamp within a log file or Markdown document, use the full, standard format.

```markdown
- **Task Completed:** 2025-08-31T01:58:00Z
- **Log Entry:** [2025-08-31T01:58:00Z] System initialized.
```

## 3. Rationale

Using a single, standardized, timezone-aware format prevents a whole class of bugs and confusion related to time. It ensures that logs can be sorted chronologically regardless of where or when they were generated.
