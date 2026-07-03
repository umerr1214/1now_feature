from typing import Literal, Optional

from pydantic import BaseModel


class Vehicle(BaseModel):
    id: str
    make: str
    model: str
    year: int
    plate: str
    listedDailyRate: float
    addedDate: str
    imageColor: Optional[str] = None
    utilization: float


class Booking(BaseModel):
    id: str
    vehicleId: str
    startDate: str
    endDate: str
    totalAmount: float
    source: Literal["direct", "turo"]
