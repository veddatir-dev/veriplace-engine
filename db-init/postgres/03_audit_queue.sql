-- Create the outbox queue table to pass cryptographic hashes to the Python daemon
CREATE TABLE audit_queue (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    record_hash VARCHAR(255) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING'
);  