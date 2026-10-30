from fastapi import APIRouter, Depends
import asyncpg
from database import get_db

router = APIRouter(prefix="/api/reports", tags=["Reporting & Analytics"])

@router.get("/department-placements")
async def get_department_placements(conn: asyncpg.Connection = Depends(get_db)):
    """
    Aggregates placement statistics by department using GROUP BY.
    """
    query = """
        SELECT 
            d.DepartmentName,
            COUNT(s.StudentID) AS TotalStudents,
            SUM(CASE WHEN s.PlacedTier IS NOT NULL THEN 1 ELSE 0 END) AS PlacedCount
        FROM 
            Department d
        LEFT JOIN 
            Student s ON d.DepartmentID = s.DepartmentID
        GROUP BY 
            d.DepartmentName
        ORDER BY 
            PlacedCount DESC;
    """
    rows = await conn.fetch(query)
    return [dict(row) for row in rows]

@router.get("/company-conversions")
async def get_company_conversions(conn: asyncpg.Connection = Depends(get_db)):
    """
    Analyzes company application pipelines to show conversion rates.
    """
    query = """
        SELECT 
            c.CompanyName,
            COUNT(sa.ApplicationID) AS TotalApplications,
            SUM(CASE WHEN sa.FinalStatus = 'HIRED' THEN 1 ELSE 0 END) AS TotalHired
        FROM 
            Company c
        JOIN 
            PlacementDrive pd ON c.CompanyID = pd.CompanyID
        LEFT JOIN 
            StudentApplication sa ON pd.DriveID = sa.DriveID
        GROUP BY 
            c.CompanyName
        ORDER BY 
            TotalHired DESC, TotalApplications DESC;
    """
    rows = await conn.fetch(query)
    return [dict(row) for row in rows]