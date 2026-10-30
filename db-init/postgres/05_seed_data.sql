-- Idempotent demo data. This script adds missing demo rows without truncating user data.

INSERT INTO Department (DepartmentName, HOD_Name)
SELECT 'Department of Engineering ' || i, 'Dr. Professor ' || i
FROM generate_series(1, 50) AS series(i)
WHERE NOT EXISTS (
    SELECT 1
    FROM Department d
    WHERE d.DepartmentName = 'Department of Engineering ' || i
);

INSERT INTO Skill (SkillName, SkillCategory)
SELECT 'Technical Skill ' || i,
       CASE WHEN i % 2 = 0 THEN 'Programming' ELSE 'Domain Specific' END
FROM generate_series(1, 50) AS series(i)
WHERE NOT EXISTS (
    SELECT 1
    FROM Skill s
    WHERE s.SkillName = 'Technical Skill ' || i
);

INSERT INTO Company (CompanyName, Industry, ContactEmail, TierCategory)
SELECT 'Corporate Enterprise ' || i,
       CASE WHEN i % 3 = 0 THEN 'IT/Software'
            WHEN i % 3 = 1 THEN 'Finance'
            ELSE 'Manufacturing' END,
       'hr.contact' || i || '@company.com',
       CASE WHEN i % 4 = 0 THEN 'Dream'
            WHEN i % 4 = 1 THEN 'Core'
            ELSE 'Mass' END
FROM generate_series(1, 50) AS series(i)
ON CONFLICT (ContactEmail) DO NOTHING;

INSERT INTO Student (
    FullName, Email, Phone, Tenth_Marks, Twelfth_Marks,
    CGPA, ActiveBacklogs, DeadBacklogs, DepartmentID
)
SELECT 'Student Name ' || i,
       'student' || i || '@university.edu',
       '555-1000-' || LPAD(i::text, 3, '0'),
       (60 + ((i * 13) % 40))::numeric(5,2),
       (60 + ((i * 17) % 40))::numeric(5,2),
       (5 + ((i * 17) % 501) / 100.0)::numeric(4,2),
       (i * 7) % 4,
       (i * 3) % 5,
       d.DepartmentID
FROM generate_series(1, 50) AS series(i)
JOIN Department d
  ON d.DepartmentName = 'Department of Engineering ' || i
ON CONFLICT (Email) DO NOTHING;

INSERT INTO StudentSkill (StudentID, SkillID, ProficiencyLevel, CertificationLink)
SELECT s.StudentID,
       skill.SkillID,
       CASE WHEN mapping.skill_offset = 0 THEN 'Intermediate' ELSE 'Advanced' END,
       NULL
FROM generate_series(1, 50) AS students(i)
CROSS JOIN generate_series(0, 1) AS mapping(skill_offset)
JOIN Student s
  ON s.Email = 'student' || students.i || '@university.edu'
JOIN Skill skill
  ON skill.SkillName = 'Technical Skill ' ||
     (((students.i + mapping.skill_offset * 11 - 1) % 50) + 1)
ON CONFLICT (StudentID, SkillID) DO NOTHING;

INSERT INTO PlacementDrive (
    CompanyID, JobRole, Package_LPA, DriveDate,
    Min_CGPA, Max_Backlogs_Allowed, TargetSkillID
)
SELECT c.CompanyID,
       'Software Engineer Role ' || i,
       (4 + ((i * 7) % 220) / 10.0)::numeric(6,2),
       CURRENT_DATE + i,
       (6 + ((i * 3) % 31) / 10.0)::numeric(4,2),
       i % 3,
       skill.SkillID
FROM generate_series(1, 50) AS series(i)
JOIN Company c
  ON c.ContactEmail = 'hr.contact' || i || '@company.com'
JOIN Skill skill
  ON skill.SkillName = 'Technical Skill ' || i
WHERE NOT EXISTS (
    SELECT 1
    FROM PlacementDrive existing
    WHERE existing.CompanyID = c.CompanyID
      AND existing.JobRole = 'Software Engineer Role ' || i
);

INSERT INTO StudentApplication (
    StudentID, DriveID, EligibilityStatus, FinalStatus
)
SELECT s.StudentID,
       drive.DriveID,
       CASE WHEN application.i % 4 = 0 THEN 'PENDING' ELSE 'ELIGIBLE' END,
       CASE WHEN application.i % 10 = 0 THEN 'HIRED'
            WHEN application.i % 7 = 0 THEN 'REJECTED'
            ELSE 'IN_PROGRESS' END
FROM generate_series(1, 100) AS application(i)
JOIN Student s
  ON s.Email = 'student' || (((application.i - 1) % 50) + 1) || '@university.edu'
JOIN Company c
  ON c.ContactEmail = 'hr.contact' ||
     ((((application.i - 1) % 50 + (application.i - 1) / 50 * 11) % 50) + 1) ||
     '@company.com'
JOIN PlacementDrive drive
  ON drive.CompanyID = c.CompanyID
 AND drive.JobRole = 'Software Engineer Role ' ||
     ((((application.i - 1) % 50 + (application.i - 1) / 50 * 11) % 50) + 1)
WHERE NOT EXISTS (
    SELECT 1
    FROM StudentApplication existing
    WHERE existing.StudentID = s.StudentID
      AND existing.DriveID = drive.DriveID
);

INSERT INTO InterviewRound (ApplicationID, RoundName, RoundStatus)
SELECT application.ApplicationID,
       round_data.RoundName,
       CASE WHEN round_data.round_number = 1 THEN 'COMPLETED' ELSE 'SCHEDULED' END
FROM StudentApplication application
JOIN Student s ON s.StudentID = application.StudentID
CROSS JOIN (
    VALUES (1, 'Technical Test'), (2, 'HR Interview')
) AS round_data(round_number, RoundName)
WHERE s.Email LIKE 'student%@university.edu'
  AND NOT EXISTS (
      SELECT 1
      FROM InterviewRound existing
      WHERE existing.ApplicationID = application.ApplicationID
        AND existing.RoundName = round_data.RoundName
  );

-- Backfill the current integrity hash if a demo student predates the trigger.
INSERT INTO audit_queue (student_id, record_hash, sync_status)
SELECT s.StudentID,
       encode(digest(s.StudentID::text || '_' || s.CGPA::text || '_' ||
                     s.ActiveBacklogs::text, 'sha256'), 'hex'),
       'PENDING'
FROM Student s
WHERE s.Email LIKE 'student%@university.edu'
  AND NOT EXISTS (
      SELECT 1
      FROM audit_queue q
      WHERE q.student_id = s.StudentID
        AND q.record_hash = encode(digest(
            s.StudentID::text || '_' || s.CGPA::text || '_' ||
            s.ActiveBacklogs::text, 'sha256'
        ), 'hex')
  );
