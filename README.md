# 🎓 SCC A/L Attendance Management System

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Express](https://img.shields.io/badge/API-Express-lightgrey?logo=express)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-brightgreen?logo=netlify)
![Render](https://img.shields.io/badge/Backend-Render-purple?logo=render)

A modern, role-based **Attendance Management System** built with **React** for **SCC A/L Art Section**.  
This system allows **Teachers, Coordinators, and Admins** to manage daily student attendance records efficiently with role-specific dashboards.

---

## 🚀 Features

### 🔑 Authentication & Security
- Secure **login system** with role-based access control.
- Session persistence with **JWT authentication**.
- Temporary password handling with **change password** flow.

### 👩‍🏫 Teacher Dashboard
- Record **daily attendance** (boys, girls, total).
- Auto-set date with **Sri Lanka time zone** support.
- View up to **20 recent records**.
- Data saved securely in the backend.

### 📊 Coordinator Dashboard
- Filter attendance by **Year, Month, and Class**.
- View detailed records with teacher names.
- Statistics: **Total Records, Students, and Averages**.
- Export-ready structured data.

### 🛠️ Admin Dashboard
- Add and manage **Teachers** with assigned classes.
- Edit teacher’s **assigned class** dynamically.
- Add new **Coordinators** with auto-generated temporary passwords.
- System overview with **real-time statistics**:
  - Total Teachers
  - Total Attendance Records
  - Total Students Recorded
  - Classes Available

---

## 🖼️ Screenshots

> _(Optional: Add screenshots of login, teacher dashboard, coordinator dashboard, and admin dashboard)_

---

## 🛠️ Tech Stack

- **Frontend:** React, Lucide Icons, CSS  
- **Backend API:** Node.js + Express (Hosted on [Render](https://render.com))  
- **Database:** PostgreSQL (via backend API)  

---

## 📂 Project Structure
```
src/
├── App.jsx       # Main application with all role-based dashboards
├── App.css       # Styling for all components
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/umyanga2005/School-AL-Management-System.git
   cd scc-al-attendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run locally**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

---

## 👥 User Roles & Demo Credentials

### 👩‍🏫 Teacher
- Role: Submit daily attendance for assigned class.

### 📊 Coordinator
- Role: View & filter attendance reports.
- **Demo:**  
  - Username: `coordinator`  
  - Password: `coordinator`

### 🛠️ Admin
- Role: Manage teachers, coordinators, and system overview.

---

## 🌍 Deployment
- Frontend: Deployable on **Netlify**, **Vercel**, or any React-compatible hosting.  
- Backend: Hosted on **Render**.  

---

## 📌 Roadmap / Future Improvements
- ✅ Export attendance data to **Excel / PDF**.  
- ✅ Mobile-friendly responsive UI.  
- 🔲 Notifications for missing attendance.  
- 🔲 Advanced analytics with charts.  

---

## 🤝 Contributing
Pull requests are welcome. For significant changes, please open an issue first to discuss what you would like to change.

---

## 📜 License
This project is licensed under the **MIT License**.
