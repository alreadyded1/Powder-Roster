from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String)
    volunteers_needed = Column(Integer, default=1)
    notes = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"))

    season = relationship("Season", back_populates="shifts")
    created_by = relationship("User", foreign_keys=[created_by_id])
    assignments = relationship("ShiftAssignment", back_populates="shift")
