# Student Feedback System

A MERN stack application for collecting anonymous student feedback about lecturers and subjects.

## Features

- User registration with role-based access (Student, Lecturer, Admin)
- Anonymous feedback submission
- Role-based dashboards
- Semester-based subject assignment
- Feedback period management

## Tech Stack

- **Frontend:** React.js + Vite + TailwindCSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   MONGO_URI=mongodb://localhost:27017/student-feedback
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. Start MongoDB service.

5. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and go to `http://localhost:5173`

### Usage

1. Register as an Admin first to set up departments and subjects.
2. Register students and lecturers.
3. Set semester dates.
4. Students can submit feedback during the last 2 weeks of the semester.
5. Lecturers can view feedback reports.
6. Admin can manage the system.

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Student
- GET /api/student/subjects
- POST /api/student/feedback

### Lecturer
- GET /api/lecturer/feedback
- GET /api/lecturer/report

### Admin
- POST /api/admin/department
- POST /api/admin/subject
- DELETE /api/admin/user/:userId
- POST /api/admin/semester

## Database Models

- User
- Student
- Lecturer
- Department
- Subject
- Feedback
- Semester

## Notes

- Feedback is completely anonymous; no student ID is stored in feedback collection.
- Feedback submission is only allowed during the last 14 days of the semester.
- Students can submit feedback only once per subject per semester (basic implementation).