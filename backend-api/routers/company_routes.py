from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from database import get_db

router = APIRouter(prefix="/api/companies", tags=["Company Management"])

# Pydantic schema for incoming requests
class CompanyCreate(BaseModel):
    CompanyName: str
    Industry: str
    ContactEmail: str
    TierCategory: str

@router.get("/")
async def get_all_companies(conn: asyncpg.Connection = Depends(get_db)):
    """Retrieves all companies."""
    rows = await conn.fetch("SELECT * FROM Company ORDER BY CompanyID ASC;")
    return [dict(row) for row in rows]

@router.post("/")
async def create_company(company: CompanyCreate, conn: asyncpg.Connection = Depends(get_db)):
    """Creates a new company record."""
    query = """
        INSERT INTO Company (CompanyName, Industry, ContactEmail, TierCategory)
        VALUES ($1, $2, $3, $4) RETURNING CompanyID;
    """
    new_id = await conn.fetchval(query, company.CompanyName, company.Industry, company.ContactEmail, company.TierCategory)
    return {"message": "Company added successfully", "CompanyID": new_id}

@router.put("/{company_id}")
async def update_company(company_id: int, company: CompanyCreate, conn: asyncpg.Connection = Depends(get_db)):
    """Updates an existing company."""
    query = """
        UPDATE Company 
        SET CompanyName = $1, Industry = $2, ContactEmail = $3, TierCategory = $4
        WHERE CompanyID = $5;
    """
    result = await conn.execute(query, company.CompanyName, company.Industry, company.ContactEmail, company.TierCategory, company_id)
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company updated successfully"}

@router.delete("/{company_id}")
async def delete_company(company_id: int, conn: asyncpg.Connection = Depends(get_db)):
    """Deletes a company record."""
    result = await conn.execute("DELETE FROM Company WHERE CompanyID = $1;", company_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}