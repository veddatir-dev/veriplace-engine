import time
import hashlib
import json
import asyncio
import websockets
import psycopg2
import psycopg2.extras
from pymongo import MongoClient
from config import PG_URL, MONGO_URL

# Set of active WebSocket connections to the React frontend
connected_clients = set()

async def ws_handler(websocket, path):
    """Handles new WebSocket connections from the React Dashboard."""
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

async def scan_integrity():
    """Continuously polls PostgreSQL, computes live hashes, and verifies against MongoDB."""
    print("Initializing Integrity Scanner Daemon...")
    
    pg_conn = psycopg2.connect(PG_URL)
    pg_cursor = pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client['veriplace']
    collection = db['immutable_ledger']
    
    print("Scanner ready. Executing 5-second polling cycles...")

    while True:
        try:
            # Fetch all critical operational records
            pg_cursor.execute("SELECT StudentID, CGPA, ActiveBacklogs FROM Student;")
            students = pg_cursor.fetchall()
            
            for student in students:
                student_id = student['studentid']
                cgpa = student['cgpa']
                backlogs = student['activebacklogs']
                
                # Reconstruct the exact string format used by the PL/pgSQL trigger
                data_string = f"{student_id}_{cgpa}_{backlogs}"
                
                # Compute live SHA-256 hash in Python
                live_hash = hashlib.sha256(data_string.encode('utf-8')).hexdigest()
                
                # Fetch the isolated, immutable hash from MongoDB
                ledger_entry = collection.find_one({'student_id': student_id})
                
                if ledger_entry:
                    locked_hash = ledger_entry.get('record_hash')
                    
                    # THE CORE CYBERSECURITY CHECK
                    if live_hash != locked_hash:
                        print(f"!!! CRITICAL MISMATCH DETECTED ON STUDENT ID {student_id} !!!")
                        print(f"Live Hash: {live_hash}")
                        print(f"Locked Hash: {locked_hash}")
                        
                        alert_payload = {
                            "type": "TAMPER_ALERT",
                            "student_id": student_id,
                            "live_hash": live_hash,
                            "locked_hash": locked_hash,
                            "timestamp": time.time()
                        }
                        
                        # Broadcast alert to the React SOC Dashboard immediately
                        if connected_clients:
                            websockets.broadcast(connected_clients, json.dumps(alert_payload))
                            
        except Exception as e:
            print(f"[ERROR] Scanner execution failed: {e}")
            
        # Wait 5 seconds before the next sweep
        await asyncio.sleep(5)

async def main():
    # Start the WebSocket server on port 8765
    server = await websockets.serve(ws_handler, "0.0.0.0", 8765)
    print("Threat Alert WebSocket Server listening on ws://0.0.0.0:8765")
    
    # Run the integrity scanner concurrently
    await scan_integrity()

if __name__ == "__main__":
    # Delay startup slightly to let databases initialize
    time.sleep(5)
    asyncio.run(main())