# AI Daily Report Prompt Protocol

Whenever the user (Admin/000 or Developer) pastes a daily report summary into the chat, the AI MUST follow this strict protocol to parse the input and generate the JSON file in `apps/rentopus-pulse/src/data/history/`.

## 1. Trigger
The user will provide a prompt similar to:
"Log today's work for 000: We created the auth system, designed the login page, and fixed the CORS error."

## 2. AI Action (NO DATABASE REQUIRED)
1. Determine today's date (or the date provided by the user) in `DD-MM-YYYY` format.
2. Formulate the JSON file name `YYYY-MM-DD.json`.
3. Create the file in `apps/rentopus-pulse/src/data/history/YYYY-MM-DD.json`.
4. The JSON MUST follow this structure exactly:
```json
{
  "date": "DD-MM-YYYY",
  "dayNumber": <calculate_from_previous_files>,
  "title": "<English Title>",
  "titleGu": "<Gujarati Title>",
  "members": ["000"],
  "tasksEn": [
    { "member": "000", "text": "Task 1 description in English" }
  ],
  "tasksGu": [
    { "member": "000", "text": "Task 1 description in Gujarati" }
  ],
  "deliverables": ["Auth System", "Login Page"]
}
```
5. Translate the user's tasks accurately into professional Gujarati for `tasksGu`.
6. Once the file is created via `write_to_file`, ask the user if they want to `git commit` and `git push`. DO NOT push automatically.
