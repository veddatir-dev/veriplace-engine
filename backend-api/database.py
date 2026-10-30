import os
import asyncpg

# Fetch the connection string from docker-compose environment variables
PG_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@postgres-tier1:5432/veriplace")

class Database:
    pool = None

    @classmethod
    async def connect(cls):
        """Initializes the async connection pool on application startup."""
        cls.pool = await asyncpg.create_pool(PG_URL)
        print("Connected to PostgreSQL Tier-1.")

    @classmethod
    async def disconnect(cls):
        """Closes the connection pool on application shutdown."""
        if cls.pool:
            await cls.pool.close()
            print("Disconnected from PostgreSQL Tier-1.")

async def get_db():
    """Dependency injection to provide a database connection to our routers."""
    async with Database.pool.acquire() as conn:
        yield conn