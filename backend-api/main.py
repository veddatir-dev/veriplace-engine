from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Database
from routers import (
    placement_routes, 
    attack_simulator, 
    company_routes, 
    application_routes, 
    report_routes
)

app = FastAPI(
    title="VeriPlace Backend API", 
    description="Operational API for Placement Management and Cyber Threat Simulation."
)

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await Database.connect()

@app.on_event("shutdown")
async def shutdown():
    await Database.disconnect()

# Include all routers
app.include_router(placement_routes.router)
app.include_router(attack_simulator.router)
app.include_router(company_routes.router)
app.include_router(application_routes.router)
app.include_router(report_routes.router)