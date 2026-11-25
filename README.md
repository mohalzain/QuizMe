# Quiz

> This won't take long.

**Status: work in progress.** The core loop works, but a lot is still missing or rough. See [Roadmap](#roadmap).

Type any topic and get a set of multiple-choice questions generated on the spot. Pick an answer, see whether you got it right, and keep trying until you do.

The backend is FastAPI and uses an OpenAI model to write the questions. The frontend is plain HTML, CSS and JavaScript with no framework and no build step.

## How it works

1. You enter a topic on the quiz page.
2. The frontend sends it to `POST /api`.
3. The backend asks the LLM for 3 MCQs in a fixed JSON format (question, 4 answers, correct answer).
4. The questions go back to the browser. The backend keeps the correct answers in a session tied to a `track-id` cookie.
5. Each time you click an answer, the frontend calls `POST /check-answer-api`, and the server checks it against what it stored.

Because the correct answer is checked on the server, you can't see it just by looking at what the page has loaded.

## Project structure

```
.
├── .env
├── backend/
│   └── app/
│       └── test.py          # FastAPI app
└── frontend/
    ├── home.html            # landing page
    ├── index.html           # quiz page
    └── static/
        ├── css/
        │   ├── home.css
        │   └── style.css
        └── js/
            └── script.js
```

The backend finds `frontend/` by going three levels up from `test.py`. It reads `.env` from `../../.env`, relative to the folder you start the server from. If you change the layout, update both paths.

## Setup

### Requirements

- Python 3.10+
- An OpenAI API key

### Install

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi uvicorn openai python-dotenv python-multipart
```

### Environment

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your-key-here
```

Don't commit this file. Add `.env` to `.gitignore`.

### Run

Start the server from the backend app folder so the `.env` path resolves:

```bash
cd backend/app
uvicorn test:app --reload
```

Then open http://127.0.0.1:8000.

## API

### `POST /api`

Generates questions for a topic.

Request:

```json
{ "topic": "Linear algebra" }
```

Response:

```json
{
  "status": "SUCESS",
  "data": [
    {
      "question": "What is the rank of the identity matrix of size n?",
      "answers": ["0", "1", "n", "n^2"],
      "correct": "n"
    }
  ]
}
```

It also sets a `track-id` cookie that identifies your session. Form-encoded and multipart requests are accepted too, but only JSON requests create a session, so only those work with answer checking.

### `POST /check-answer-api`

Checks one answer against the stored session.

Request:

```json
{ "question_index": 0, "answer": "n" }
```

Response:

```json
{ "message": "sucess", "data": 1 }
```

`data` is `1` for correct, `0` for wrong. The `track-id` cookie must be present.

## Roadmap

### Done

- [x] Landing page and quiz page
- [x] Topic input that generates 3 MCQs through the LLM
- [x] Correct answers checked on the server, not shown in the browser
- [x] Retry until you get it right, with a try counter

### To do

- [ ] Validate the LLM response (Pydantic or structured outputs)
- [ ] Random session IDs (`uuid4`) instead of an incrementing counter
- [ ] Move sessions out of memory (Redis or a database)
- [ ] Score screen at the end of a quiz
- [ ] Let the user pick how many questions to get
- [ ] Proper error responses instead of catch-all `except`
- [ ] Lock CORS down to real origins

## Known limitations (for now)

- Sessions live in a Python dict in memory. They're lost on restart and aren't shared between workers.
- `track-id` is a plain incrementing number, so anyone can change it to read another user's session.
- If the model returns malformed JSON or a different shape, the request fails.
- CORS is open to all origins.

## Tech stack

- **Backend:** FastAPI, OpenAI Python SDK
- **Frontend:** HTML, CSS, vanilla JavaScript
