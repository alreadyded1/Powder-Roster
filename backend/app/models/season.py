from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    self_signup = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"))

    created_by = relationship("User", foreign_keys=[created_by_id])
    shifts = relationship("Shift", back_populates="season")
