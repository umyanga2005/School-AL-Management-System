# SCC A/L Art Management System

A modern, full-stack application to manage school-level Advanced Level (A/L) art administration — built with React (frontend) and Node.js/Express (backend).

---

## 🚀 Features

- Manage student, teacher, and class data relevant to A/L art management.
- Authentication using JWT.
- Secure and modular backend with support for Supabase (PostgreSQL).
- Responsive frontend using React.
- Configurable via environment variables.

---

## 🛠 Tech Stack

**Frontend:**  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

**Backend:**  
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

**Database:**  
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**Other Tools:**  
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

---

## 📂 Directory Structure

```
/
├── backend/           # Node.js/Express backend
│   ├── src/
│   ├── package.json
│   └── ...
├── src/ (frontend)    # React app
│   ├── components/
│   ├── pages/
│   ├── App.js
│   └── ...
├── public/
│   └── assets (e.g., logo.png)
├── .gitignore
├── package.json       # Monorepo root (if applicable)
└── README.md
```

> Adjust the structure above if your actual project layout differs.

---

## 🛠 Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or Yarn
- (Optional) Supabase PostgreSQL database

### Clone the Repository

```bash
git clone https://github.com/umyanga2005/School-AL-Management-System.git
cd School-AL-Management-System
```

---

## ⚙️ Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a `.env` file with the following variables:

   ```env
   PORT=5000
   NODE_ENV=development

   DEV_URL=http://localhost:3000

   JWT_SECRET=ADMINSA

   # Supabase Database Configuration
   DB_HOST=your_db_host
   DB_PORT=your_db_port
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   ```

3. Install dependencies and start the server:

   ```bash
   npm install
   npm run dev
   ```

   The server should now run at `http://localhost:5000`.

---

## 🎨 Frontend Setup

1. Navigate to your frontend folder (assuming `src/` or root):

   ```bash
   cd ../src
   ```

2. Create a `.env` file with these variables:

   ```env
   # Backend API Configuration
   REACT_APP_API_BASE_URL=http://localhost:5000/api

   # Application Configuration
   REACT_APP_SCHOOL_NAME="SCC A/L Art Management System"
   REACT_APP_SCHOOL_LOGO="/logo.png"

   # Debug Mode (set to false in production)
   REACT_APP_DEBUG_MODE=true
   ```

3. Install dependencies and start the React development server:

   ```bash
   npm install
   npm start
   ```

   The frontend will launch on `http://localhost:3000`, fetching data from the backend.

---

## 📸 Screenshots

### Login Page
![Login Page](public/screenshots/login.png)

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Student Management
![Student Management](public/screenshots/students.png)

> Add actual screenshots to the `public/screenshots/` folder and update the paths above.

---

## 📑 Usage

1. Launch both backend and frontend as described above.
2. Open `http://localhost:3000` in your browser.
3. Interact with the system using the school name and logo you configured.
4. Debug mode is enabled — great for development and testing.

---

## 🔧 Environment Variables Overview

| **File**      | **Variable**             | **Purpose**                                    |
|---------------|---------------------------|------------------------------------------------|
| `backend/.env`| `PORT`                    | Port on which the server runs (default: 5000)  |
|               | `NODE_ENV`                | Environment mode (`development` or `production`) |
|               | `DEV_URL`                 | URL for frontend client                        |
|               | `JWT_SECRET`              | Secret for signing JWT tokens                  |
|               | `DB_HOST`, `DB_PORT`, etc.| Supabase/PostgreSQL connection details         |
| `frontend/.env`| `REACT_APP_API_BASE_URL` | API base URL (e.g. `http://localhost:5000/api`) |
|               | `REACT_APP_SCHOOL_NAME`   | Name displayed in the UI                       |
|               | `REACT_APP_SCHOOL_LOGO`   | Path to logo asset                             |
|               | `REACT_APP_DEBUG_MODE`    | Toggles debug features (true/false)            |

---

## 🏗 Building for Production

### Backend

```bash
cd backend
npm run build        # if applicable
npm run start
```

Ensure your `.env` settings are production-ready (`NODE_ENV=production`, `REACT_APP_DEBUG_MODE=false`, secure `JWT_SECRET`).

### Frontend

```bash
cd src
npm run build
```

Deploy build (e.g., serve with Nginx or Netlify), and update `REACT_APP_API_BASE_URL` to the production API endpoint.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a branch (`git checkout -b feature/your-feature`).
3. Implement your feature and commit (`git commit -m "Add your feature"`).
4. Push your branch (`git push origin feature/your-feature`).
5. Submit a Pull Request.

---

## 📜 License

This project is open-source and available under the MIT License. Feel free to adapt as needed.

---

## 📧 Contact

For questions or feedback, reach out to the maintainer at **[umyanga2005](https://github.com/umyanga2005)** on GitHub.

---

**Enjoy building your A/L Art Management System!**
