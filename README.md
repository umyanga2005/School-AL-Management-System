# 📘 School A/L Management System

A modern, role-based Attendance Management System developed using React, Node.js, Express, and PostgreSQL. This system is tailored for the Sri Lanka School Certificate (SCC) Advanced Level (A/L) Art Section, enabling efficient management of daily student attendance records.

---

## 🚀 Features

- **Role-Based Access**: Distinct roles for Teachers, Coordinators, and Admins to manage attendance and related tasks.
- **Daily Attendance Tracking**: Facilitates the recording of student attendance on a daily basis.
- **Responsive Design**: Ensures a seamless experience across various devices.
- **Secure Authentication**: Implemented using JWT for secure user sessions.
- **Real-Time Updates**: Utilizes WebSockets for live attendance updates.

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Encryption**: Node.js `crypto` module
- **Real-Time Communication**: Socket.io

---

## 📸 Screenshot

Login
![LMS Login Screenshot](Preview/Login.png)

Dashboard
![LMS Dashboard Screenshot](Preview/Dashboard.png)

Admin Attendece
![LMS admin Attendece Screenshot](Preview/admin Attendece.png)

Student Management
![LMS Student-Management Screenshot](Preview/Student-Management.png)

Subject Management
![LMS Subject Management Screenshot](Preview/Subject-Management.png)

Term Management
![LMS Term-Management Screenshot](Preview/Term-Management.png)

Marks Management
![LMS Marks Management Screenshot](Preview/Marks-Management.png)

Report Management
![LMS Marks Management Screenshot](Preview/Report-Section.png)

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/umyanga2005/School-AL-Management-System.git
cd School-AL-Management-System
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory and configure the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=school_al_management
JWT_SECRET=your_jwt_secret
```

---

### ⚠️ Important: Database & User Setup

Before starting the project:

1. **Create the Database and Tables**  
   Make sure your PostgreSQL database is created and all necessary tables (`users`, `attendance`, `roles`, etc.) exist. Refer to the `Tables schem.txt` file in the repository for details.

2. **Add Users Data**  
   Add at least one user for each role (Teacher, Coordinator, Admin) into the `users` table **before logging in**.

3. **Password Encryption**  
   Passwords must be stored encrypted using Node.js `crypto` module. Example:

```javascript
const crypto = require('crypto');

function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Example usage
const hashedPassword = encryptPassword('yourPasswordHere');
```

Insert the `hashedPassword` into the `password` field in the `users` table.

---

### 4. Start the Backend Server

```bash
npm start
```

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Start the Frontend Server

```bash
npm start
```

The application should now be running on `http://localhost:3000`.

---

## 📄 Database Schema

The database schema includes tables for users, attendance records, and roles. See the `Tables schem.txt` file for full details.

---

## 📄 License

This project is licensed under the MIT License.

---

