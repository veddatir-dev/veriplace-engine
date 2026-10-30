import os

# Connect via Docker's internal DNS using the dummy credentials
PG_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@postgres-tier1:5432/veriplace")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:mongo@mongo-tier2:27017/admin")