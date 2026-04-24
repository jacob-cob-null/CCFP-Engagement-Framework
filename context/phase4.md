# Phase 4: Reporting, Dashboards & Data Export

- Tasks
    - [ ]  Build Administrative Dashboard: summary cards (employees, events, attendance, points)
        - [ ]  DashboardController with RBAC-scoped metrics
        - [ ]  Mini leaderboard (top 5 employees by points)
        - [ ]  Attendance breakdown by personnel type and event scope
    - [ ]  Build Employee Point Leaderboard: ranked view of accumulated points per employee
        - [ ]  EmployeePointsController with filters (term, unit, personnel type, search)
        - [ ]  Paginated leaderboard page with export trigger
    - [ ]  Build Audit Trail Viewer: read-only activity log browser (admin-only)
        - [ ]  AuditLogController with filters (action type, date range, search)
        - [ ]  Paginated audit log page
    - [ ]  Implement Data Export: CSV download for employees, attendance, and point totals
        - [ ]  ExportController (3 endpoints: employees, attendance per term, points per term)
        - [ ]  Export buttons on relevant pages
    - [ ]  Update Navigation: sidebar links for Points, Audit Logs
