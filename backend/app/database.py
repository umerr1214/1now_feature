from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongodb_uri)
db: AsyncIOMotorDatabase = client[settings.db_name]


def get_database() -> AsyncIOMotorDatabase:
    return db
