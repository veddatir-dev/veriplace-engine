from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from database import get_db

router = APIRouter(prefix="/api/placement", tags=["Placement Management"])

# --- Pydantic Schemas ---
class StudentCreate(BaseModel):
    FullName: str
    Email: str
    Phone: str
    CGPA: float
    ActiveBacklogs: int
    DepartmentID: int
    PlacedTier: str = None

# --- Existing Endpoints (CRUD GET) ---
@router.get("/students")
async def get_all_students(conn: asyncpg.Connection = Depends(get_db)):
    """Retrieves all students from the operational database."""
    rows = await conn.fetch("SELECT * FROM Student ORDER BY StudentID ASC;")
    return [dict(row) for row in rows]

# --- New Endpoints (CRUD POST, PUT, DELETE) ---
@router.post("/students")
async def create_student(student: StudentCreate, conn: asyncpg.Connection = Depends(get_db)):
    query = """
        INSERT INTO Student (FullName, Email, Phone, CGPA, ActiveBacklogs, DepartmentID, PlacedTier)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING StudentID;
    """
    try:
        new_id = await conn.fetchval(query, student.FullName, student.Email, student.Phone, student.CGPA, student.ActiveBacklogs, student.DepartmentID, student.PlacedTier)
        return {"message": "Student created successfully", "StudentID": new_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/students/{student_id}")
async def update_student(student_id: int, student: StudentCreate, conn: asyncpg.Connection = Depends(get_db)):
    query = """
        UPDATE Student
        SET FullName = $1, Email = $2, Phone = $3, CGPA = $4, ActiveBacklogs = $5, DepartmentID = $6, PlacedTier = $7
        WHERE StudentID = $8;
    """
    result = await conn.execute(query, student.FullName, student.Email, student.Phone, student.CGPA, student.ActiveBacklogs, student.DepartmentID, student.PlacedTier, student_id)
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student updated successfully"}

@router.delete("/students/{student_id}")
async def delete_student(student_id: int, conn: asyncpg.Connection = Depends(get_db)):
    result = await conn.execute("DELETE FROM Student WHERE StudentID = $1;", student_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

# --- Automated Eligibility Engine ---
@router.get("/drives/{drive_id}/automated_eligibility")
async def get_automated_eligibility(drive_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """
    Executes a complex SQL JOIN to strictly filter students based on drive requirements
    AND institutional policies (e.g., blocking students already placed in 'Dream' tier).
    """
    # Verify the drive exists
    drive = await conn.fetchrow("SELECT DriveID FROM PlacementDrive WHERE DriveID = $1;", drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Placement Drive not found")

    query = """
        SELECT s.StudentID, s.FullName, s.CGPA, s.ActiveBacklogs, s.PlacedTier, c.CompanyName
        FROM Student s
        -- Cross join with the specific drive to apply its constraints
        JOIN PlacementDrive pd ON pd.DriveID = $1
        JOIN Company c ON c.CompanyID = pd.CompanyID
        WHERE s.CGPA >= pd.Min_CGPA
          AND s.ActiveBacklogs <= pd.Max_Backlogs_Allowed
          -- Institutional Policy: Exclude students who already secured a 'Dream' tier job
          AND (s.PlacedTier IS NULL OR s.PlacedTier != 'Dream')
        ORDER BY s.CGPA DESC;
    """
    rows = await conn.fetch(query, drive_id)
    return [dict(row) for row in rows]