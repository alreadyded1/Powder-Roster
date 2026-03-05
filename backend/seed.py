#!/usr/bin/env python3
"""Seed the database with an initial super_admin user."""
from app.database import SessionLocal, engine, Base
from app.models import User, Season, Shift, ShiftAssignment  # noqa: F401
from app.models.user import UserRole
from passlib.context import CryptContext

Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@example.com").first()
        if existing:
            print("Seed data already exists.")
            return
        admin = User(
            name="Super Admin",
            email="admin@example.com",
            password_hash=pwd_context.hash("changeme"),
            role=UserRole.super_admin,
        )
        db.add(admin)
        db.commit()
        print("Created super_admin: admin@example.com / changeme")
        print("IMPORTANT: Change this password immediately after first login!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
