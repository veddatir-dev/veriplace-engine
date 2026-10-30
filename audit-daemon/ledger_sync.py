import time
import psycopg2
import psycopg2.extras
from pymongo import MongoClient
from config import PG_URL, MONGO_URL

def sync_ledger():
    print("Initializing Ledger Sync Daemon...")
    
    # Establish database connections
    pg_conn = psycopg2.connect(PG_URL)
    pg_cursor = pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client['veriplace']
    collection = db['immutable_ledger']
    
    print("Connections established. Polling audit queue...")

    while True:
        try:
            # Query for unprocessed hashes
            pg_cursor.execute("""
                SELECT id, student_id, record_hash 
                FROM audit_queue 
                WHERE sync_status = 'PENDING'
                ORDER BY id ASC;
            """)
            pending_records = pg_cursor.fetchall()
            
            if pending_records:
                for record in pending_records:
                    # UPSERT into MongoDB immutable ledger
                    collection.update_one(
                        {'student_id': record['student_id']},
                        {'$set': {'record_hash': record['record_hash']}},
                        upsert=True
                    )
                    
                    # Mark as synchronized in PostgreSQL
                    pg_cursor.execute("""
                        UPDATE audit_queue 
                        SET sync_status = 'SYNCED' 
                        WHERE id = %s;
                    """, (record['id'],))
                
                pg_conn.commit()
                print(f"[SYNC] Successfully transferred {len(pending_records)} hash records to MongoDB.")
                
        except Exception as e:
            print(f"[ERROR] Sync failure: {e}")
            pg_conn.rollback()
        
        # Poll every 2 seconds
        time.sleep(2)

if __name__ == "__main__":
    # Add a slight delay on startup to ensure databases are ready
    time.sleep(5)
    sync_ledger()