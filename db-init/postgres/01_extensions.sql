-- Enable the pgcrypto extension to allow SHA-256 hashing inside the database
CREATE EXTENSION IF NOT EXISTS pgcrypto;