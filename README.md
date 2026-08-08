# Staff & Student Achievement Portal (`project_sad`)

A full-stack Web Application designed for academic institutions to streamline student achievement data entry, automate weekly/monthly email reminders to staff, generate accreditation reports (PDF/Excel/CSV), and provide administrative analytics.

---

## Directory Structure

```text
project_sad/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js               # Node.js + Express API server
│   └── src/
│       ├── config/             # DB & Email transport configs
│       ├── controllers/        # Route handlers (achievements, staff, reminders)
│       ├── models/             # Mongoose MongoDB schemas
│       └── routes/             # API Endpoint routes
├── frontend/
│   ├── Dockerfile              # Dev container with Vite HMR
│   ├── Dockerfile_Production   # Multi-stage Nginx production container
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── components/         # Reusable UI components & modals
│   │   ├── pages/              # Role views (Student, Staff, Admin)
│   │   └── services/           # API integration & export helpers
│   └── vite.config.ts
├── docker-compose.yml          # Dev orchestration with live reload & volume mounts
├── .gitignore
└── README.md
```

---

## Prerequisites

Make sure you have the following installed on your development machine:
- **Docker** & **Docker Compose** (`docker --version`, `docker compose version`)
- **Node.js** (v18+ recommended, for optional local non-Docker development)
- **Git**

---

## Development Setup (Live Reload / HMR Setup)

We use **Docker Compose with Volume Mounting** so that code changes made in your local editor (Neovim, VSCode, etc.) instantly trigger **Live Reload / Hot Module Replacement (HMR)** in your browser without needing to rebuild container images!

### 1. Clone the Repository & Navigate to Workspace
```bash
git clone https://github.com/kshrs/project-sad.git 
cd project_sad
```

### 2. Launch Development Stack with Live Reload
Run the following command in the root `project_sad` directory:

```bash
docker compose up --build
```

### Accessing the Services:
- **Frontend Dashboard (Vite HMR)**: [http://localhost:5100](http://localhost:5100)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB Database**: `mongodb://localhost:27017/sad_db`

---

## How Live Reload / Hot-Reloading Works

- **Frontend (Vite React)**: Source files inside `./frontend/src/` are mounted into the container via Docker volume bind (`./frontend:/app`). Editing any React component or CSS instantly updates the UI in real-time.
- **Backend (Express / Nodemon)**: Source files in `./backend` are volume mounted, auto-restarting the API server whenever backend routes or controllers are edited.

---

## Useful Development Commands

| Command | Action |
| :--- | :--- |
| **`docker compose up`** | Start all services (MongoDB, Backend API, Frontend) |
| **`docker compose up --build`** | Rebuild images and start all services |
| **`docker compose down`** | Stop and remove running containers |
| **`docker compose down -v`** | Stop containers and clear MongoDB local volume |
| **`docker compose logs -f backend`** | Tail backend server logs in real-time |
| **`docker compose logs -f frontend`** | Tail Vite dev server logs |

---

## Local Non-Docker Development (Alternative)

If you prefer running services directly on your host operating system:

1. **Start Local MongoDB Server**:
   Ensure MongoDB is running at `mongodb://127.0.0.1:27017/sad_db`.

2. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev   # Starts Express server on http://localhost:5000
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev   # Starts Vite React dev server on http://localhost:5173
   ```

---

## License
Internal Institutional Project.
