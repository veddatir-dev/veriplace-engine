-- Define the trigger function that calculates the SHA-256 hash
CREATE OR REPLACE FUNCTION generate_student_integrity_hash()
RETURNS TRIGGER AS $$
DECLARE
    concatenated_data TEXT;
    computed_hash VARCHAR(255);
BEGIN
    -- Combine critical fields. Changing any of these will drastically alter the resulting hash.
    concatenated_data := NEW.StudentID::TEXT || '_' || NEW.CGPA::TEXT || '_' || NEW.ActiveBacklogs::TEXT;
    
    -- Generate the SHA-256 hash using pgcrypto and convert from bytea to hex
    computed_hash := encode(digest(concatenated_data, 'sha256'), 'hex');
    
    -- Insert into the outbox queue for the Python daemon to pick up
    INSERT INTO audit_queue (student_id, record_hash, sync_status) 
    VALUES (NEW.StudentID, computed_hash, 'PENDING');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger to fire after every insert or update on the Student table
CREATE TRIGGER student_integrity_trigger
AFTER INSERT OR UPDATE ON Student
FOR EACH ROW
EXECUTE FUNCTION generate_student_integrity_hash();