# TeamTasks

TeamTasks is a full-stack collaborative task and project management application built with the MERN stack (MongoDB, Express, React, Node.js). It provides an interactive Kanban-style workspace where teams can organize tasks across customizable workflows, invite members to shared boards, and monitor real-time project activities.

---

## Features

- **Interactive Kanban Boards**: Drag-and-drop task management powered by `@dnd-kit` across **To Do**, **In Progress**, and **Done** columns with smooth animations and instant status updates.
- **Board & Task Management**: Create, rename, and delete boards. Add, edit, prioritize, and delete tasks with descriptions and due dates.
- **Role-Based Collaboration**: Board owners can invite registered users via email and manage team members with designated permissions.
- **Activity Audit Log**: Tracks board actions (creations, task updates, status moves, member invitations) in a slide-out activity drawer.
- **Search, Sort & Filter Engine**: Search boards and tasks in real-time, sort by recent activity or task count, and filter tasks by status or overdue dates.
- **Due Date & Overdue Alerts**: Calendar validation with visual highlights for overdue tasks.
- **Theme Toggle**: Built-in Dark and Light mode support with CSS custom variables.
- **Toast Notifications**: Interactive feedback on actions using Sonner toast alerts.

---

## Tech Stack

### Frontend
- **React 18** — Component-based UI library
- **Vite** — Fast frontend build tool and dev server
- **React Router 6** — Client-side routing and protected routes
- **@dnd-kit** — Drag-and-drop accessibility primitives
- **Axios** — HTTP client with auth interceptors
- **Lucide React** — UI icons
- **Sonner** — Toast notification system
- **Vanilla CSS** — Custom responsive styling with CSS variables

### Backend
- **Node.js & Express.js** — RESTful API server and routing
- **MongoDB & Mongoose** — NoSQL database and schema modeling
- **JSON Web Tokens (JWT)** — Stateless user session management
- **bcryptjs** — Password hashing
- **CORS & Dotenv** — Middleware for cross-origin requests and environment configuration
- **Nodemon** — Development server monitoring

---

## Project Structure

```text
TeamTasks/
├── client/              # React frontend (Vite)
│   ├── src/             # Components, pages, context, and API utilities
│   ├── package.json     # Client scripts and dependencies
│   └── .env.example     # Client environment variables template
├── server/              # Express backend REST API
│   ├── config/          # MongoDB database connection
│   ├── controllers/     # Route logic for auth, boards, and tasks
│   ├── middleware/      # JWT authentication and authorization
│   ├── models/          # Mongoose data schemas (User, Board, Task, Activity)
│   ├── routes/          # Express API route declarations
│   ├── package.json     # Server scripts and dependencies
│   └── .env.example     # Server environment variables template
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

---

## Authentication

The application implements secure, token-based authentication:

1. **Registration & Login**: Users sign up with a name, email, and password. Passwords are encrypted using `bcryptjs` (10 salt rounds) before storing in MongoDB.
2. **JWT Issuance**: Upon successful signup or login, the server generates a signed JSON Web Token valid for 7 days.
3. **Client-Side Storage & Interceptors**: The JWT is saved in browser `localStorage`. An Axios request interceptor automatically attaches `Authorization: Bearer <token>` to all protected API calls.
4. **Protected Routes**:
   - **Frontend**: A `ProtectedRoute` wrapper redirects unauthenticated users to `/login`. If an API returns a `401 Unauthorized`, the token is cleared and the user is redirected.
   - **Backend**: Express middleware (`authMiddleware`) verifies the JWT signature and attaches the authenticated user object to incoming requests.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | Check if the API server is online |

### Authentication (`/auth`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/signup` | No | Register a new user account |
| `POST` | `/auth/login` | No | Authenticate user and receive JWT |

### Boards (`/boards`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/boards` | Yes | Get all boards owned by or shared with the user |
| `POST` | `/boards` | Yes | Create a new board |
| `GET` | `/boards/:id` | Yes | Get details and task metrics for a single board |
| `PUT` | `/boards/:id` | Yes (Owner) | Rename or update board details |
| `DELETE` | `/boards/:id` | Yes (Owner) | Delete board along with its tasks and activity logs |

### Tasks (`/tasks` and `/boards/:id/tasks`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/boards/:id/tasks` | Yes | Get all tasks belonging to a specific board |
| `POST` | `/boards/:id/tasks` | Yes | Create a new task on a board |
| `PUT` | `/tasks/:id` | Yes | Update task title, description, due date, or status |
| `DELETE` | `/tasks/:id` | Yes | Delete a task |

### Board Members (`/boards/:id/members`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/boards/:id/members` | Yes | List board owner and members |
| `POST` | `/boards/:id/members` | Yes (Owner) | Invite a registered user by email |
| `DELETE` | `/boards/:id/members/:userId` | Yes (Owner) | Remove a member from the board |

### Activity Log (`/boards/:id/activity`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/boards/:id/activity` | Yes | Retrieve the recent activity stream for a board |

---

## Environment Variables

### Server Configuration (`server/.env`)
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Client Configuration (`client/.env`)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas account)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/TeamTasks.git
cd TeamTasks
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install client dependencies
```bash
cd ../client
npm install
```

### 4. Configure environment variables
Copy the example environment files and update them with your credentials:
```bash
# Server setup
cd ../server

# Client setup
cd ../client
```

---

## Running the Application

### Start the Backend Server
```bash
cd server
npm run dev
```
*The server will run on `http://localhost:5000` (or your defined `PORT`).*

### Start the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
```
*The client will run on `http://localhost:5173`.*

---

## Screenshots

<!-- Add screenshots/GIFs of your application here -->

| Dashboard View | Kanban Board View |
| :---: | :---: |
| *![Dashboard Placeholder](https://via.placeholder.com/600x350?text=Dashboard+View)* | *![Board View Placeholder](https://via.placeholder.com/600x350?text=Kanban+Board+View)* |

| Task Modal & Due Dates | Activity Stream Drawer |
| :---: | :---: |
| *![Task Modal Placeholder](https://via.placeholder.com/600x350?text=Task+Modal)* | *![Activity Drawer Placeholder](https://via.placeholder.com/600x350?text=Activity+Drawer)* |

---

## Future Improvements

- **Real-Time Collaboration**: Integrate WebSockets (Socket.io) for live multi-user card drag movements.
- **Task Comments & Attachments**: Enable threaded conversations and document uploads on tasks.
- **Custom Labels & Tags**: Add color-coded tags (e.g., Bug, Feature, Urgent) for quick categorization.
- **Email Notifications**: Send automated alerts when a user is invited to a board or assigned a task.
