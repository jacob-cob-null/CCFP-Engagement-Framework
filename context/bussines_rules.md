1. System Access and Roles
The system enforces Role-Based Access Control with two primary access levels.
CCFP users operate as university-based administrators with full access to all system data.
Community extension representatives operate as college-based or organization-based users with access restricted to their specific units.
The application interface is optimized for PCs to manage the main dashboard and mobile phones to process live attendance.
2. Employee Profile Management
The system strictly processes data for full-time employees only.
The database must scale to handle between 565 and 650 active employee profiles.
Employee profiles must capture the individual's Name, Employee Number, College, and Personnel Type (Teaching or Non-teaching).
Historical employee lists and past event data must be importable from legacy Excel spreadsheets.
Institutional data policies require explicit permission from HR regarding employee privacy and data processing.
3. Event Configuration
Event creation requires the user to input the Event Title, Description, and Activity/Project Program.
Every event must be classified by its scope as University-based, College-based, or Organization-based.
The system must track events individually while keeping all corresponding attendance data centralized.
4. Attendance Processing
Employees record attendance by entering their Name or Employee Number.
The system must process attendance in real-time to eliminate manual encoding errors, missing names, and messy handwriting issues.
A QR code scanning module must be supported as a secondary attendance input method if deemed technically feasible during development.
5. Point Allocation Engine
Points are automatically calculated and awarded when attendance is successfully submitted.
The system defaults to awarding 1 point for regular participation or donations and 2 points for organizing committee members.
Point values must be dynamic to accommodate specific event rules and changing grading requirements.
Authorized administrators must be able to manually edit or override points for specific individuals.
Points are tracked independently per event but must accumulate into a running total for each employee until the end of the academic year.
6. Data Integrity and Archiving
Data must never be permanently deleted from the system.
Raw attendance logs will undergo a soft deletion at the end of each semester to clear the active user interface.
The semester soft deletion process must not erase or reset the annual accumulated point totals.
The system must maintain an immutable audit trail for all user actions to ensure compliance and security.
All database records must be exportable to Excel or Google Sheets for external review.
The database architecture must account for long-term storage growth and handle potential race conditions during data backups.
7. Reporting and System Outputs
The system must generate reports allowing employees to view their total accumulated points.
The administrative dashboard must generate automated summaries displaying attendance percentages across different demographics.
Progress reports must be capable of being generated to track milestones before the final deadline.
8. Deployment and Infrastructure
POSLAB will be utilized for initial software prototyping due to a lack of live hosting budget and university drive limitations.
Early-stage deployment requires technical coordination and support from CCS or EMHIS.
The core users and MISS will handle internal troubleshooting after the final project handoff.
The hard deadline for the project is the second semester.
Project success is measured by completing pilot testing on an actual event, achieving functional real-time tracking, and significantly reducing errors compared to the manual system.
