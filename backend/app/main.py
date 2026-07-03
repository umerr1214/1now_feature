from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import get_database
from app.models import Booking, Vehicle
from app.seed import backfill_utilization, seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_database()
    await seed_if_empty(db)
    await backfill_utilization(db)
    yield


app = FastAPI(title="Fleet Pulse API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/vehicles", response_model=list[Vehicle])
async def get_vehicles():
    db = get_database()
    docs = await db.vehicles.find().to_list(length=None)
    for doc in docs:
        doc["id"] = str(doc.pop("_id"))
    return docs


@app.get("/api/bookings", response_model=list[Booking])
async def get_bookings():
    db = get_database()
    docs = await db.bookings.find().to_list(length=None)
    for doc in docs:
        doc["id"] = str(doc.pop("_id"))
    return docs
