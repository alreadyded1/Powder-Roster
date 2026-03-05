from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, users, seasons, shifts, assignments, roster, invites, notifications, audit

# Import all models so SQLAlchemy registers them before create_all
from .models import User, Season, Shift, ShiftAssignment  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Powder Roster", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(seasons.router)
app.include_router(shifts.router)
app.include_router(assignments.router)
app.include_router(roster.router)
app.include_router(invites.router)
app.include_router(notifications.router)
app.include_router(audit.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
