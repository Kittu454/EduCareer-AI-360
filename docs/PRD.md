# Product Requirements Document (PRD) - EduCareer AI 360

## 1. Product Vision
EduCareer AI 360 is an enterprise-grade, intelligent education and career development platform. The vision is to bridge the gap between academic performance, real-world skills, and professional opportunities by providing personalized, data-driven AI coaching, skill-gap analysis, and end-to-end placement management. It empowers students with clear pathways, helps faculty support at-risk students, provides Training & Placement Officers (TPOs) with actionable cohort statistics and job matching capability, and offers administrators a centralized system to govern the career readiness lifecycle.

## 2. Problem Statement
Educational institutions often operate in silos where academic grades do not clearly translate into career readiness. Students struggle to identify industry-relevant skill gaps, lack tailored career pathways, and lack objective evaluations of their resume readiness. Simultaneously, faculty lack tools to identify and support struggling students early in the semester, TPOs rely on manual spreadsheets to screen students for recruiters, and corporate recruiters receive poor-fit applications due to ineffective resume screening and student matching.

## 3. Target Users
- **Students**: Seeking academic improvement, skill enhancement, resume evaluation, tailored career roadmaps, job opportunities, and personalized AI coaching.
- **Faculty**: Academic advisors and department heads tracking course compliance, identifying academic risk, and providing skill validations.
- **Training & Placement Officers (TPOs)**: Institutional placement coordinators coordinating recruitment drives, monitoring readiness metrics, and matching candidates to employer profiles.
- **Administrators**: IT staff, Registrars, and system owners managing role provisioning, security settings, integration channels, and audit trails.

## 4. User Personas
### Student Persona: Aarav Mehta
- **Profile**: 3rd-year Computer Science undergraduate student.
- **Pain Points**: Confused between Web Development and Data Engineering paths. Does not know if his resume matches job standards. Unsure of how to fill the gaps in his portfolio.
- **Goals**: Analyze resume relevance for target job profiles, get step-by-step learning roadmaps, and secure a high-paying internship.

### Faculty Persona: Dr. Preeti Sharma
- **Profile**: Associate Professor in Information Technology.
- **Pain Points**: Manages 120+ students. Cannot manually track who is falling behind in practical skills versus theory.
- **Goals**: View dashboard analytics to identify academically at-risk students, flag students needing remedial classes, and validate project skills.

### TPO Persona: Rajesh Gowda
- **Profile**: Head of Corporate Relations and Placements.
- **Pain Points**: Spends hours filtering spreadsheets of student GPA and skills to send to recruiters. Hard to track who has completed mock interviews.
- **Goals**: Automatically filter students based on placement-readiness scores, coordinate job drives, track student applications, and present recruitment dashboards to the board.

### Administrator Persona: Samuel Wright
- **Profile**: Chief IT Systems Administrator.
- **Pain Points**: Needs to ensure student data privacy compliance, prevent unauthorized role escalation, and track system audits.
- **Goals**: Maintain system uptime, manage SSO integrations, monitor model cost and API health, and audit role changes.

## 5. Product Goals
- **Empower Student Choice**: Provide a dynamic "What-If" simulator that helps students understand the career implications of switching specializations.
- **Accelerate Hiring Cycles**: Decrease candidate sourcing time for TPOs by 40% using automated job matching and placement readiness models.
- **Improve Student Performance**: Enable faculty to identify at-risk students within the first 4 weeks of the term.
- **Deliver Actionable AI Guidance**: Provide highly contextualized learning roadmaps and 24/7 conversational coaching.
- **Ensure Enterprise-Grade Security**: Support robust RBAC, full audit trails, and strict data governance.

## 6. Functional Requirements Overview
The platform contains modular panels specialized by role, centering on:
- Academic performance ingestion and visualization.
- Interactive resume uploading, parsing, and scoring.
- Customized AI learning timeline maps.
- Job drive listings, candidate matching, and application pipelines.
- AI Chat coach with context preservation.
- Simulated skill profiles for "What-If" scenarios.

## 7. Non-Functional Requirements
- **Performance**: Page load times under 2 seconds for dashboards; search/filter actions under 500ms; AI Chat responses stream in real-time or render initial response in < 3 seconds.
- **Scalability**: Support up to 50,000 active students and 1,000 recruiters/TPOs simultaneously during peak campus placement seasons.
- **Reliability**: 99.9% uptime for core database and application servers.
- **Maintainability**: Modular microservices backend, clear visual separation conforming to `docs/DESIGN.md`, and comprehensive unit tests (>80% coverage).
- **Usability**: High contrast interfaces following dark-mode guidelines; zero complex data charts without legend/tooltip assistance.

## 8. User Roles and Permissions
The platform implements Role-Based Access Control (RBAC) with the following matrix:

| Feature/Resource | Student | Faculty | TPO | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| View Personal Academics & Roadmaps | Read/Write | Read | Read | Read |
| AI Career Coach Chat | Read/Write | - | - | Read |
| Edit Class Records & Performance Data | - | Read/Write | - | Read/Write |
| Job Drive Management & Application Review | - | - | Read/Write | Read/Write |
| Institutional Placement Analytics | - | Read | Read/Write | Read/Write |
| System Logs & API Configuration | - | - | - | Read/Write |
| Global Role Provisioning | - | - | - | Read/Write |

---

## FEATURES & CAPABILITIES

### 9. Complete Student Features
- **Dashboard Overview**: Displays GPA progress, current skills, upcoming mock drives, and immediate actions.
- **Resume Portal**: File drop section supporting PDF upload, parser status indicator, and match rating.
- **Timeline Roadmap**: Visual interactive roadmaps displaying completed, active, and locked skill modules.
- **AI Chat Coach**: Panel to query career guidance, get mock interview practice, and search for tips.
- **Job Board**: Unified list of active job postings matched to their profile.
- **Simulator Panel**: "What-If" career explorer to toggle skill parameters.

*Individual Feature Specification: Resume Portal*
- **Purpose**: Allows students to submit and evaluate their resume against target career profiles.
- **User**: Student
- **Inputs**: Resume file (PDF), Target Role selection.
- **Processing**: Extracts layout structure, matches skills and text against role taxonomies, calculates structural and grammar rating, flags missing keywords.
- **Outputs**: Parsed profile overview, scoring gauge (0-100), key recommendation points.
- **Dependencies**: Parser Engine, AI/ML evaluation service.
- **Success Criteria**: Parse succeeds in < 15 seconds; feedback identifies at least 3 actionable improvements.

### 10. Complete Faculty Features
- **Student Cohort Analytics**: View aggregated GPA trends, attendance averages, and course completions.
- **Early Intervention Flags**: Lists students identified as "At-Risk" due to low performance/low engagement.
- **Recommendation Engine**: Submit custom validation tags for students' technical or practical work.

*Individual Feature Specification: Early Intervention Flags*
- **Purpose**: Flags students showing signs of academic struggle for timely counseling.
- **User**: Faculty
- **Inputs**: Course gradebook, attendance sheets, project submittals.
- **Processing**: Calculates composite risk indicator based on weighted attendance trends and quiz scores.
- **Outputs**: Alert list with high/medium risk categories, student contacts, and toggle to log feedback.
- **Dependencies**: Academic database, analytical scoring logic.
- **Success Criteria**: Accurate flagging of students below 65% performance rating; system records interventions successfully.

### 11. Complete TPO Features
- **Job Drive Manager**: Form to post new job descriptions, criteria (e.g., minimum GPA), and deadlines.
- **Student Placement-Readiness Filter**: Advanced multi-select filtering interface to generate recruiter lists.
- **Recruitment Analytics**: Funnel charts showing applications, shortlists, offers, and rejections.

*Individual Feature Specification: Placement-Readiness Filter*
- **Purpose**: Enables TPOs to rapidly shortlist students for corporate partners.
- **User**: TPO
- **Inputs**: GPA range, Skill tags, Placement readiness score bracket, graduation year.
- **Processing**: Filters database collections based on selected arguments.
- **Outputs**: CSV/PDF exportable roster of matching student details.
- **Dependencies**: Student profile database, export engine.
- **Success Criteria**: Generates shortlists in under 2 seconds; search handles multi-field logical queries correctly.

### 12. Complete Admin Features
- **User Provisioning**: System to upload user rosters (CSV) or manually assign roles.
- **Audit Logs**: Viewer interface displaying modification logs of grades, role adjustments, and settings.
- **API and Model Controls**: Configure keys and temperature parameters for external LLM interfaces.

*Individual Feature Specification: Audit Logs*
- **Purpose**: Maintains a tamper-proof ledger of critical configuration changes.
- **User**: Administrator
- **Inputs**: Event logs from application servers.
- **Processing**: Indexes log files by date, user ID, and action category.
- **Outputs**: Searchable tabular log list.
- **Dependencies**: Database Logging adapter, System event stream.
- **Success Criteria**: Records all administrative edits instantly; system supports searching logs by date and actor.

---

### 13. Career Recommendation Functionality
- **Purpose**: Suggests suitable career roles based on student profiles.
- **User**: Student, Faculty (Advisor)
- **Inputs**: Student academic grades, skill profile, interests, extracurricular preferences.
- **Processing**: Calculates cosine similarity against a database of industry roles and required competency vectors.
- **Outputs**: Top 3 career suggestions with compatibility percentages (e.g., "94% Match for UI Designer").
- **Dependencies**: Recommendation model, Job criteria catalog.
- **Success Criteria**: 90% of student surveys rate recommended paths as highly relevant.

### 14. Skill-Gap Analysis
- **Purpose**: Identifies missing competencies for a desired career goal.
- **User**: Student, Faculty
- **Inputs**: Chosen Target Career Role, Student's verified skill inventory.
- **Processing**: Performs set subtraction between Target skills and Student skills; maps missing items to level of urgency.
- **Outputs**: Interactive list of gaps categorized into "Critical", "Secondary", and "Recommended".
- **Dependencies**: Skill taxonomy database.
- **Success Criteria**: Precision of gaps identified; provides exact mapping to learning modules.

### 15. Career Roadmap
- **Purpose**: Directs students through a chronological learning journey to close skill gaps.
- **User**: Student
- **Inputs**: Skill-gap analysis output, preferred timeline (weeks/months).
- **Processing**: Sequences courses, projects, and assessments into a logical vertical timeline.
- **Outputs**: Visual timeline component displaying nodes (Completed, Current, Locked) with resource links.
- **Dependencies**: Course catalog, Skill gap metrics.
- **Success Criteria**: Dynamic regeneration when a student marks a milestone complete or changes targets.

### 16. Academic Performance Analytics
- **Purpose**: Analyzes and visualizes academic data for monitoring performance.
- **User**: Student, Faculty, TPO
- **Inputs**: Grade sheets, term transcripts, semester reports.
- **Processing**: Computes cumulative GPA, trends over time, and compares student indices to class averages.
- **Outputs**: Interactive line graphs, radar charts of subject strengths, and performance prediction models.
- **Dependencies**: Data visualization library, Academic records repository.
- **Success Criteria**: Visual updates match high-contrast layout guidelines; data loads accurately without mismatch.

### 17. Placement Readiness
- **Purpose**: Predicts the likelihood of a student securing a job offer in recruitment drives.
- **User**: Student, TPO
- **Inputs**: GPA, mock interview performance, skill badges, resume score, attendance.
- **Processing**: Passes features to a classification/regression model predicting readiness index (0-100%).
- **Outputs**: Unified numerical score, category label (High, Moderate, Action Needed), and top drivers.
- **Dependencies**: Scoring algorithm, historical placement training data.
- **Success Criteria**: Predictive score updates after every mock test, giving realistic alignment with final hiring.

### 18. Resume Analysis
- **Purpose**: Parses uploaded resumes to assess structural quality and keyword matches.
- **User**: Student, TPO
- **Inputs**: PDF / DOCX resume file.
- **Processing**: Utilizes NLP parsing to extract sections (Experience, Projects, Education) and flags grammar issues or format errors.
- **Outputs**: Actionable enhancement tips, score cards, and highlighted text suggestions.
- **Dependencies**: File parsing middleware, NLP LLM engine.
- **Success Criteria**: Accurately parses standard single/double column layout templates.

### 19. Job Matching
- **Purpose**: Automatically pairs students with active employer openings.
- **User**: Student, TPO
- **Inputs**: Job description parameters, student skills, academic eligibility limits.
- **Processing**: Matches job skill criteria against student profile attributes using semantic search matches.
- **Outputs**: Compatibility score list, application button, and recruiter match percentage.
- **Dependencies**: Active jobs listings database.
- **Success Criteria**: Ranks relevant students at the top of placement pools; filters ineligible applicants.

### 20. Application Tracking
- **Purpose**: Monitors the status of job applications through the recruitment cycle.
- **User**: Student, TPO
- **Inputs**: Application status updates (Submitted, Shortlisted, Interviewing, Offered, Rejected).
- **Processing**: Updates student dashboards and logs actions into the placement tracking system.
- **Outputs**: Visual status pipeline dashboard for students; overview grids for TPOs.
- **Dependencies**: Placement event system.
- **Success Criteria**: Real-time status update visible to applicant without lag.

### 21. What-If Career Simulator
- **Purpose**: Let students model career impact of developing new skills or improving grades.
- **User**: Student
- **Inputs**: Toggled skill items (e.g. adding 'Python' or increasing GPA target).
- **Processing**: Re-runs career recommendation and placement readiness engines with hypothetical values.
- **Outputs**: Real-time shifts in Match Scores (e.g., UI updates from 70% match to 88% match).
- **Dependencies**: recommendation and scoring simulator engine.
- **Success Criteria**: Clean visual interaction with slider or checklist updates that dynamically recalculate metrics.

### 22. AI Career Coach
- **Purpose**: Offers conversational, context-aware career and study guidance.
- **User**: Student
- **Inputs**: Free-text chat queries, historical student records (grades, goals).
- **Processing**: Prompts LLM using unified student context to return personalized coaching responses.
- **Outputs**: Conversational text suggestions, code/project starter ideas, links to learning tracks.
- **Dependencies**: External LLM integration, Chat history cache.
- **Success Criteria**: Retains conversation history; answers queries accurately with academic/professional context.

### 23. Notifications
- **Purpose**: Alerts users about critical deadlines, application updates, or risk alerts.
- **User**: All roles
- **Inputs**: System events (New job posted, application state change, student flagged as at-risk).
- **Processing**: Triggers in-app alerts and schedules email/push notifications.
- **Outputs**: UI notification panel dropdown lists, email alerts.
- **Dependencies**: Notification broker system.
- **Success Criteria**: Alerts arrive within 5 seconds of event triggers.

### 24. Reports and Analytics
- **Purpose**: Generates operational and strategic intelligence reports for administrators and TPOs.
- **User**: TPO, Admin, Faculty
- **Inputs**: Cohort grades, application pipelines, system audits.
- **Processing**: aggregates historical metrics into time-series datasets.
- **Outputs**: Exportable PDF/CSV reports, interactive dashboards.
- **Dependencies**: Aggregation databases.
- **Success Criteria**: System supports complex query aggregations without affecting live transaction databases.

### 25. Search and Filtering
- **Purpose**: Enables searching and finding students, jobs, reports, or skills.
- **User**: All roles
- **Inputs**: Query keyword, category filter selectors.
- **Processing**: Matches query values with database indexes.
- **Outputs**: Dynamic filtered list results.
- **Dependencies**: Database indexing.
- **Success Criteria**: Autocomplete support, results update dynamically inside the views.

### 26. File Upload Requirements
- **Supported Formats**: `.pdf` (resumes, academic certificates), `.csv` (student rosters for admins/faculty).
- **Size Limits**: Resumes: Maximum 5MB; Student roster CSVs: Maximum 20MB.
- **Security Check**: Scanning uploads for malware, file signature verification (magic bytes), and sanitization before staging files.

### 27. Data Requirements
- **Schema Separation**: Strict isolation of student academic data, placement registries, and AI conversational logs.
- **Retention Policies**: Student profiles retained until 1 year post-graduation unless manually deleted.
- **Backup**: Daily database snapshots with hourly transactional logs replication.

### 28. AI/ML Requirements
- **Model Governance**: Strict prompts to prevent hallucinations or generic non-career guidance.
- **Feedback Loops**: User thumb-up/down feedback captured on advice to continuously fine-tune recommendation weights.
- **Response Validation**: Guardrails to sanitize LLM output to prevent leakage of operational system prompts.

### 29. Security Requirements
- **Authentication**: OAuth2 / SSO integration supported. MFA required for TPO and Administrators.
- **Encryption**: TLS 1.3 in transit, AES-256 for data at rest.
- **Data Protection**: Strict row-level security ensuring faculty only access assigned class cohorts, and students only access personal evaluations.

### 30. Audit Requirements
- **Tracking Scope**: High-risk activities must be permanently logged: profile role changes, grade adjustments, resume overrides, and job posting creations.
- **Log Structure**: Fields include Timestamp, User Identifier, Client IP, Operation Type, Old Value, and New Value.

### 31. Accessibility Requirements
- **Standard**: WCAG 2.1 AA Compliance.
- **Keyboard Navigation**: Full application operable without mouse.
- **Screen Readers**: Descriptive ARIA labels on dynamic elements, form inputs, and state badges.

### 32. Responsive Requirements
- **Breakpoints**: 360px - 430px (mobile phones), 768px - 1024px (tablets), 1440px+ (desktop screen).
- **Navigation Adapters**: Switch navigation style dynamically based on window width.
- **Interactive UI**: Target touch targets at least 44x44px on mobile screens.

### 33. Future Scalability Requirements
- **Cross-Institutional Support**: Tenant routing capabilities to host multiple college portals on a single platform instance.
- **Integration Webhooks**: Direct pipelines to external job posting systems (LinkedIn, Indeed) and Learning Management Systems (Canvas, Moodle).

---

## MAJOR USER JOURNEYS

### Journey 1: Student Career Readiness Optimization
1. **Login**: Student Aarav logs in and lands on the dashboard showing his target job (Data Engineer).
2. **Resume Evaluation**: Uploads his resume to the Resume Portal. The parser evaluates the document, reporting an AI Match Score of 62%.
3. **Skill-Gap Identification**: The Skill-Gap Analysis panel highlights missing skills: 'Spark' and 'SQL Optimization'.
4. **Roadmap Navigation**: Aarav visits his personalized Career Roadmap. He sees a recommended course path for SQL Optimization, marks the first unit as complete, and the system recalculates his progress.
5. **AI Interaction**: Aarav asks the AI Career Coach: "How should I describe my project on Spark in my resume?" The AI provides contextual instructions and a description block.
6. **Career Simulation**: Toggles the "What-If" simulator to see what his readiness score would be if he completed the 'Spark' competency. Score increases to 78%.
7. **Job Search and Apply**: Aarav checks the Job Board, finds a Data Engineer internship matching his updated profile, and submits his parsed resume.

### Journey 2: Faculty Early Academic Intervention
1. **Dashboard Check**: Dr. Preeti logs in, landing on the course cohort analytics screen.
2. **Identify Risk**: The early intervention flags system alerts her to 3 students categorized as "At-Risk" due to quiz scores dropping below 60%.
3. **Analyze Detail**: Clicks on student profile link to evaluate overall subject performance trend charts.
4. **Initiate Action**: Tags the students for mandatory remedial labs and logs an internal counseling note in the system.

### Journey 3: TPO Job Drive Sourcing and Matching
1. **Drive Creation**: Rajesh logs in, navigates to the Job Drive Manager, and enters a new job description for a "Associate Software Developer".
2. **Set Criteria**: Configures requirement parameters: Minimum CGPA = 7.5, Skill tags = 'React' and 'Node.js'.
3. **Candidate Search**: Executes the Placement-Readiness Filter with the set criteria. The system returns a shortlist of 42 qualified students.
4. **Applicant Notification**: Selects the student roster and triggers a match notification alert to all candidate dashboards.

---

## ASSUMPTIONS & OPEN QUESTIONS

### Assumptions
- **SSO Integration**: The institution already possesses an active OAuth2/SSO provider containing correct role mappings for students and faculty.
- **Academic Source of Truth**: The platform is not the primary registrar database; it will consume student grade sheets and attendance data from external APIs or CSV files.
- **LLM Access**: Stable, high-speed API connectivity is available for LLM inference (e.g., Azure OpenAI or Google Gemini API).

### Open Questions
1. **Real-time Synchronization vs. Batch Ingestion**: Should student grades and attendance lists be synchronized in real-time with the institution's LMS, or is batch CSV uploading at the end of each day/week sufficient?
2. **Third-Party Job Posting Feeds**: Will the platform only display campus recruitment drives posted by the TPO, or do we need to integrate external APIs (like Indeed or LinkedIn) for open-market job listings?
3. **Resume Parsing Constraints**: Does the parser need to support image-based resumes via OCR, or should it restrict uploads strictly to text-based PDF/DOCX layouts?
4. **Local Model Hosting vs. SaaS APIs**: For placement-readiness prediction, should the model run as a local microservice (e.g. Scikit-learn/PyTorch) or call external machine learning pipelines?
