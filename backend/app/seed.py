from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase


def _iso_date(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def _iso_datetime(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _days_ago(now: datetime, days: int) -> datetime:
    return now - timedelta(days=days)


def _build_vehicles(now: datetime) -> list[dict]:
    added = _iso_date(_days_ago(now, 90))
    return [
        {
            "make": "Toyota",
            "model": "Camry",
            "year": 2022,
            "plate": "ABC123",
            "listedDailyRate": 85,
            "addedDate": added,
            "imageColor": "#ef4444",
        },
        {
            "make": "Honda",
            "model": "Civic",
            "year": 2023,
            "plate": "DEF456",
            "listedDailyRate": 75,
            "addedDate": added,
            "imageColor": "#3b82f6",
        },
        {
            "make": "Nissan",
            "model": "Altima",
            "year": 2022,
            "plate": "JKL012",
            "listedDailyRate": 70,
            "addedDate": added,
            "imageColor": "#f59e0b",
        },
        {
            "make": "Ford",
            "model": "Mustang",
            "year": 2023,
            "plate": "MNO345",
            "listedDailyRate": 95,
            "addedDate": added,
            "imageColor": "#8b5cf6",
        },
        {
            "make": "BMW",
            "model": "3 Series",
            "year": 2023,
            "plate": "PQR678",
            "listedDailyRate": 110,
            "addedDate": added,
            "imageColor": "#ec4899",
        },
    ]


def _build_bookings(now: datetime, vehicle_ids: list[str]) -> list[dict]:
    camry_id, civic_id, altima_id, mustang_id, bmw_id = vehicle_ids

    def booking(vehicle_id: str, start_days_ago: int, end_days_ago: int, amount: float, source: str) -> dict:
        return {
            "vehicleId": vehicle_id,
            "startDate": _iso_datetime(_days_ago(now, start_days_ago)),
            "endDate": _iso_datetime(_days_ago(now, end_days_ago)),
            "totalAmount": amount,
            "source": source,
        }

    return [
        # Toyota Camry — idleDays=4, no near-future booking -> healthy
        booking(camry_id, 20, 17, 255, "direct"),
        booking(camry_id, 8, 4, 340, "turo"),
        # Honda Civic — idleDays=6 but suppressed by booking starting in 2 days -> healthy
        booking(civic_id, 15, 12, 225, "direct"),
        booking(civic_id, 9, 6, 270, "turo"),
        booking(civic_id, -2, -5, 255, "direct"),
        # Nissan Altima — idleDays=7 -> idle-warning
        booking(altima_id, 20, 17, 210, "direct"),
        booking(altima_id, 10, 7, 231, "turo"),
        # Ford Mustang — idleDays=8 -> idle-warning
        booking(mustang_id, 25, 22, 285, "direct"),
        booking(mustang_id, 12, 8, 380, "turo"),
        # BMW 3 Series — idleDays=12 -> idle-critical
        booking(bmw_id, 30, 27, 330, "direct"),
        booking(bmw_id, 16, 12, 440, "turo"),
    ]


async def seed_if_empty(db: AsyncIOMotorDatabase) -> None:
    await db.vehicles.create_index("plate", unique=True)
    await db.bookings.create_index("vehicleId")

    if await db.vehicles.count_documents({}) > 0:
        return

    now = datetime.now(timezone.utc)
    vehicles = _build_vehicles(now)
    result = await db.vehicles.insert_many(vehicles)
    vehicle_ids = [str(_id) for _id in result.inserted_ids]

    bookings = _build_bookings(now, vehicle_ids)
    await db.bookings.insert_many(bookings)
