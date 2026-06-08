# Fiction Author Portfolio Template

Full-stack portfolio for a young fiction novelist, organized as:

- `frontend/`: React + TypeScript + Vite.
- `backend/`: Python + FastAPI REST API.
- `docker-compose.yml`: optional local Docker setup.

## Features

- Public portfolio tabs: biography, library, blog, press, events and contact.
- Work detail pages with purchase links, reviews and visitor comments.
- Admin panel with login, visual forms, language copies, rich text editing, image upload and comment moderation.
- Role-ready auth model: `visitor`, `author`, `administrator`, extensible to more roles.
- SQLite database stored at `backend/app/storage/portfolio.sqlite3`, easy to inspect/edit while the server is stopped.
- Uploaded covers are cropped to a vertical folio-like ratio.
- Light/dark theme toggle with a theme abstraction ready for future custom themes.
- Spanish fallback for untranslated content.

## Default admin

The backend seeds one administrator on first run:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

Change this before production.

## Run locally

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:8080`

Backend API: `http://localhost:8000`

## Notes for deployment

- Set a strong `SECRET_KEY`.
- Keep `backend/app/storage` mounted as persistent storage.
- For production, put the API behind HTTPS and restrict CORS origins.
- SQLite is intentionally used here because the data file remains directly inspectable and editable offline.

## Deployment
### Backend
1. Opción A -> Docker:
```bash
git clone <tu-repo>
cd portfolio-template
docker compose up --build -d
```
2. Opción B -> uvicorn:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```
