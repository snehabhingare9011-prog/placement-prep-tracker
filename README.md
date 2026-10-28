# HireVerse — Company-Wise Placement Preparation & Interview Readiness Platform

HireVerse is a full-stack MERN application that transforms placement preparation for engineering students and college placement departments. It centralizes company-specific preparation blueprints, categorized question practice, timed server-evaluated mock assessments, rule-based preparation roadmaps, transparent readiness scoring, and campus placement drive administration.

---

## 🚀 Key Features by Module

### Module A: Public Landing & Authentication
- **Public Landing Page**: Hero section, 4-step preparation workflow, top tech company previews, dual-value proposition for students and placement cells, transparent scoring explanation, and interactive FAQ.
- **Secure Authentication**: Student registration with academic profile details (college, degree, branch, graduation year, CGPA), login with JWT token issuance, password reset workflows, and role-based route protection.
- **Role Security**: Public registration is restricted to students. Privileged roles (`placement_officer`, `faculty`, `admin`) are safeguarded against unauthorized self-assignment.

### Module B: Student Preparation Dashboard
- **Personalized Header**: Welcomes students and indicates profile completion.
- **Verifiable Readiness Score**: Real-time score calculated deterministically from student activity with "Not enough activity yet" onboarding guidance for new users.
- **Target Company Banner**: Displays current recruitment round focus and difficulty tier with 1-click company switching.
- **Today's Preparation Tasks**: Prioritized curriculum tasks with interactive toggle that persists directly to MongoDB.
- **Identified Bottlenecks**: Automatically surfaces weak subjects (e.g. Graphs, OS) derived from objective attempt accuracy.
- **Activity Metrics & Streaks**: Questions solved, accuracy %, tests completed, and continuous daily streaks computed from verified activity logs.

### Module C: Company & Role Preparation Hub
- **Company Directory**: Searchable and filterable by difficulty tier (Foundation, Intermediate, Advanced) and industry.
- **Side-by-Side Comparison**: Select up to 3 companies to compare recruitment patterns and readiness scores.
- **Company Blueprint Detail**: Recruitment round timelines, eligibility criteria (minimum CGPA, allowed branches, batches), frequently tested subjects, required skills matrix, company-tagged questions, and linked mock assessments.

### Module D: Question Bank & Server-Evaluated Practice
- **Multi-Category Coverage**: Data Structures & Algorithms, Core CS (DBMS, OS, Networks, OOP), Aptitude (Quantitative, Logical, Verbal), Technical, and HR/Behavioral.
- **Objective Server Evaluation**: Multiple-choice answers are evaluated server-side against protected answer keys. Immediate verification, correct option revelation, and detailed algorithmic explanations.
- **Descriptive & Code Solutions**: Allows students to submit and save approach notes, complexity analyses, and pseudocode to their persistent practice history.
- **Bookmarks & Filter Bar**: Filter by subject, difficulty, and keyword search. Save questions for later review.

### Module E: Server-Governed Mock Test System
- **Pre-Test Briefing**: Displays test duration, marking rules (+4 marks for correct, -1 for incorrect negative marking), and question count.
- **Server-Driven Countdown Timer**: The timer is governed by `startTime` and `durationMinutes` stored in MongoDB. Refreshing the browser or navigating away does not reset or manipulate the examination clock.
- **Focused Test Interface**: Question statements, answer choices, next/previous controls, mark for review, and an interactive 4-state question palette (Current, Answered, Marked for Review, Unanswered).
- **Server Scoring & Post-Test Review**: Immediate calculation of marks, percentage, correct/incorrect/unanswered counts, time taken, subject-wise accuracy breakdown, and identified weak topics. Full post-test solution review reveals all official keys and explanations.

### Module F: Rule-Based Preparation Roadmap Engine
- **Deterministic 4-Phase Curriculum**:
  - Phase 1: Programming Foundations & Core Algorithms
  - Phase 2: Data Structures & Problem Solving Patterns
  - Phase 3: Core Computer Science Fundamentals (DBMS, OS, SQL)
  - Phase 4: Mock Assessments & Placement Interview Drills
- **Milestone Persistence**: Toggle task completion with instant backend persistence and curriculum progress percentage updates.
- **Configurable Generator**: Choose target company, role, and available study period (4, 8, or 12 weeks) to automatically regenerate the curriculum aligned with weak subjects.

### Module G: Transparent Readiness Scoring & Progress Analytics
- **Documented Formula**:
  $$\text{Readiness Score} = 0.35 \times \text{Practice Accuracy} + 0.30 \times \text{Mock Test Average} + 0.20 \times \text{Roadmap Progress} + 0.15 \times \text{Subject Coverage}$$
- **Zero Fabricated Metrics**: Displays "Not enough activity yet" when data is insufficient. Every point is reproducible from saved attempts.
- **Analytics Visualizations**: 7-day study effort chart, topic-wise accuracy bars, target company readiness comparison, and verified audit activity log.

### Module H: Placement Officer & Faculty Portal
- **Student Directory**: Search and filter students by branch, graduation year, and minimum CGPA.
- **Student Progress Inspector**: Review individual student readiness scores, practice count, and mock test scores.
- **Campus Placement Drives**: Announce and configure on-campus placement drives with CTC packages, drive dates, application deadlines, and eligibility criteria.
- **Campus Broadcasts**: Publish announcements and notifications to student feeds.

### Module J: Administrative Workspace
- **Platform Overview**: Database counts for registered users, students, staff, companies, questions, mock tests, and test attempts.
- **User Account Management**: Search users, toggle active/inactive account status, and assign permitted roles.
- **Question Bank Repository**: Create, edit, and delete questions, configure options, correct answer keys, and solution explanations.
- **Company Management**: Add and manage new target companies and roles.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, React Router v7, Lucide React, Axios, Custom Modular CSS Design System.
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JSON Web Tokens (JWT), BcryptJS, Helmet, CORS, Express-Rate-Limit, MongoMemoryServer (automatic zero-config fallback for instant local execution).
- **Testing**: Node.js Test Runner (`node:test`, `node:assert`), Supertest.

---

## 🔑 Demo Accounts for Evaluation

Quick-fill buttons are provided directly on the Sign-In screen (`/login`) for instantaneous access:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student** | `student@hireverse.dev` | `Student@123` | Arjun Sharma (Final Year, CGPA 8.4, active preparation data) |
| **Placement Officer** | `placement@hireverse.dev` | `Officer@123` | Dr. Sunita Rao (Training & Placement Cell Coordinator) |
| **Faculty Mentor** | `faculty@hireverse.dev` | `Faculty@123` | Prof. Ramesh Gupta (Department Placement Mentor) |
| **System Admin** | `admin@hireverse.dev` | `Admin@123` | Central System Administrator |

---

## 📦 Setup & Execution Guide

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+ or v10+)

### 1. Installation
Clone the repository and install root and server dependencies:
```bash
# In the project root
npm install

# In the server directory
cd server
npm install
cd ..
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory (or use `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/hireverse?retryWrites=true&w=majority
JWT_SECRET=hireverse_jwt_dev_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```
> **Note:** Configure `MONGODB_URI` with your MongoDB Atlas cloud database connection string. Ensure your Atlas Database User is created and your IP address (or `0.0.0.0/0`) is added to Atlas Network Access. Automated unit/integration tests run in an isolated in-memory database to keep cloud data untouched.

### 3. Database Seeding
Seed realistic sample companies, questions, mock tests, demo accounts, and placement drives:
```bash
npm run seed
```

### 4. Running the Application
Open two terminal tabs:

**Terminal 1 (Backend Server):**
```bash
npm run server
# Server runs at http://localhost:5000/api/v1
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev
# Frontend runs at http://localhost:5173
```

### 5. Running Automated Tests
Run the comprehensive backend test suite covering authentication, role-based authorization, server-side mock test timing/evaluation, and deterministic readiness calculations:
```bash
npm run test:server
```

### 6. Building for Production
```bash
npm run build
```

---

## 🔒 Security Architecture
- Password hashing using `bcryptjs` with salt rounds.
- Tokens signed with JWT and verified via `Authorization: Bearer <token>` middleware.
- Resource ownership checks prevent students from inspecting or altering other students' test attempts or roadmaps.
- Correct answers and question explanation keys are excluded from test-taking API payloads until the assessment is finalized and submitted.
- Rate limiting on authentication routes prevents brute-force attempts.
- Centralized error handling sanitizes database errors and hides stack traces in production.
- Strictly non-AI: no external AI APIs, fake streaming, or fabricated LLM responses.
