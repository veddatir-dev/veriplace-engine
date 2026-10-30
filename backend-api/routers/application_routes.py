from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import asyncpg
from database import get_db

router = APIRouter(prefix="/api/applications", tags=["Application Tracking"])

@router.get("/")
async def get_applications(conn: asyncpg.Connection = Depends(get_db)):
    """Returns applications with the student and company names used by the tracker."""
    query = """
        SELECT sa.ApplicationID, s.FullName AS StudentName,
               c.CompanyName, sa.FinalStatus
        FROM StudentApplication sa
        JOIN Student s ON s.StudentID = sa.StudentID
        JOIN PlacementDrive pd ON pd.DriveID = sa.DriveID
        JOIN Company c ON c.CompanyID = pd.CompanyID
        ORDER BY sa.ApplicationID ASC;
    """
    rows = await conn.fetch(query)
    return [dict(row) for row in rows]

class BatchUpdateRequest(BaseModel):
    application_ids: List[int]
    new_status: str

@router.put("/batch-update")
async def batch_update_status(request: BatchUpdateRequest, conn: asyncpg.Connection = Depends(get_db)):
    """
    Batch updates the FinalStatus of multiple student applications simultaneously.
    """
    if not request.application_ids:
        raise HTTPException(status_code=400, detail="No application IDs provided")
        
    query = """
        UPDATE StudentApplication 
        SET FinalStatus = $1 
        WHERE ApplicationID = ANY($2::int[]);
    """
    
    try:
        # Pass the list of IDs as an array to PostgreSQL
        result = await conn.execute(query, request.new_status, request.application_ids)
        
        # Extract the number of updated rows from the command tag (e.g., 'UPDATE 5')
        updated_count = int(result.split(" ")[1]) 
        
        return {
            "message": f"Successfully updated {updated_count} applications to '{request.new_status}'",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))