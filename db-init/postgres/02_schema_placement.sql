-- Create Department Table
CREATE TABLE Department (
    DepartmentID SERIAL PRIMARY KEY,
    DepartmentName VARCHAR(255) NOT NULL,
    HOD_Name VARCHAR(255)
);

-- Create Student Table (Mission Critical)
CREATE TABLE Student (
    StudentID SERIAL PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Phone VARCHAR(20) UNIQUE NOT NULL,
    Tenth_Marks DECIMAL(5,2),
    Twelfth_Marks DECIMAL(5,2),
    CGPA DECIMAL(4,2) NOT NULL,
    ActiveBacklogs INT NOT NULL,
    DeadBacklogs INT DEFAULT 0,
    ConsentStatus BOOLEAN DEFAULT TRUE,
    PlacedTier VARCHAR(50),
    DepartmentID INT NOT NULL,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
);

-- Create Skill Table
CREATE TABLE Skill (
    SkillID SERIAL PRIMARY KEY,
    SkillName VARCHAR(255) NOT NULL,
    SkillCategory VARCHAR(100)
);

-- Create StudentSkill Associative Table
CREATE TABLE StudentSkill (
    StudentID INT NOT NULL,
    SkillID INT NOT NULL,
    ProficiencyLevel VARCHAR(50),
    CertificationLink TEXT,
    PRIMARY KEY (StudentID, SkillID),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE,
    FOREIGN KEY (SkillID) REFERENCES Skill(SkillID) ON DELETE CASCADE
);

-- Create Company Table
CREATE TABLE Company (
    CompanyID SERIAL PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    Industry VARCHAR(100),
    ContactEmail VARCHAR(255) UNIQUE,
    TierCategory VARCHAR(50)
);

-- Create PlacementDrive Table
CREATE TABLE PlacementDrive (
    DriveID SERIAL PRIMARY KEY,
    CompanyID INT NOT NULL,
    JobRole VARCHAR(255) NOT NULL,
    Package_LPA DECIMAL(6,2),
    DriveDate DATE,
    Min_CGPA DECIMAL(4,2),
    Max_Backlogs_Allowed INT,
    TargetSkillID INT,
    FOREIGN KEY (CompanyID) REFERENCES Company(CompanyID) ON DELETE CASCADE,
    FOREIGN KEY (TargetSkillID) REFERENCES Skill(SkillID) ON DELETE SET NULL
);

-- Create StudentApplication Associative Table
CREATE TABLE StudentApplication (
    ApplicationID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL,
    DriveID INT NOT NULL,
    ApplicationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EligibilityStatus VARCHAR(50) DEFAULT 'PENDING',
    FinalStatus VARCHAR(50) DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE,
    FOREIGN KEY (DriveID) REFERENCES PlacementDrive(DriveID) ON DELETE CASCADE
);

-- Create InterviewRound Weak Entity Table
CREATE TABLE InterviewRound (
    RoundID SERIAL PRIMARY KEY,
    ApplicationID INT NOT NULL,
    RoundName VARCHAR(100) NOT NULL,
    RoundStatus VARCHAR(50) DEFAULT 'SCHEDULED',
    FOREIGN KEY (ApplicationID) REFERENCES StudentApplication(ApplicationID) ON DELETE CASCADE
);