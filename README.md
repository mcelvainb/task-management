# Task Management System (Full Stack RBAC)

A secure, role-based task management system built in an NX monorepo.  
This project demonstrates authentication, role-based access control (RBAC), and a responsive Angular frontend connected to a NestJS backend.

---

## 📁 Monorepo Structure
```
task-management/
│
├── apps/
│ ├── api/ # NestJS backend (authentication, RBAC, tasks API)
│ └── dashboard/ # Angular frontend (task dashboard UI)
│
├── libs/
│ ├── data/ # Shared DTOs and interfaces
│ └── auth/ # Reusable RBAC logic and decorators
│
├── nx.json
├── package.json
└── tsconfig.base.json
```

---

## Core Features

### Backend (NestJS + TypeORM + SQLite)
- JWT authentication (login/register)
- Role-based access control:
  - Owner, Admin, Viewer
  - Org-level access enforcement
- Task CRUD with permission checks
- Basic audit logging (console)
- Organization and user role hierarchy
- Auto-seeding of roles

### Frontend (Angular + TailwindCSS)
- Login screen with JWT storage
- Responsive dashboard displaying tasks
- Task creation, filtering, and status updates
- Local time formatting for timestamps
- Live updates of task count

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/mcelvainb/task-management.git
cd task-management
```
### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables

Create a ```.env``` file in the root:
```ini
JWT_SECRET=supersecretkey
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/db.sqlite
PORT=3000
```

### 4. Run the Backend (NestJS API)
```bash
npx nx serve api
```
Runs on http://localhost:3000
### 5. Run the Frontend (Angular Dashboard)
```bash
npx nx serve dashboard
```
Runs on http://localhost:4200

## Data Model
### Entities:
* ```User```
* ```Organization```
* ```Role (Owner, Admin, Viewer)```
* ```UserRole (intersection for many-to-many relationships)```
* ```Task```
### Relationships:
* One organization can have many users
* A user can have multiple roles
* A task belongs to an organization

##Access Control Implementation
* Every request must include a valid JWT token.
* Decorators and guards enforce RBAC at the controller level.
* Owners can view/manage all tasks in their organization.
* Admins can manage tasks but not organization settings.
* Viewers can only read tasks.
* Tasks are always scoped to the user’s organization.

## API Endpoints
| Method | Endpoint         | Description           | Auth | Role        |
| ------ | ---------------- | --------------------- | ---- | ----------- |
| POST   | `/auth/register` | Register a new user   | No   | -           |
| POST   | `/auth/login`    | Login and receive JWT | No   | -           |
| GET    | `/tasks`         | Get accessible tasks  | Yes  | Any         |
| POST   | `/tasks`         | Create task           | Yes  | Admin/Owner |
| PUT    | `/tasks/:id`     | Update task           | Yes  | Admin/Owner |
| DELETE | `/tasks/:id`     | Delete task           | Yes  | Admin/Owner |
| GET    | `/audit-log`     | View access logs      | Yes  | Owner/Admin |
Example
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Task","category":"Work"}'
```
## Architecture Notes
* NX Monorepo: Keeps frontend, backend, and shared libraries in one place for modularity.
* RBAC Logic: Centralized in libs/auth with guards and decorators for easy reuse.
* Shared DTOs: Prevents type mismatches between API and frontend.
* State: Simple reactive state management in Angular to display live updates.

## Frontend Highlights
* Built with Angular and TailwindCSS
* Task list automatically updates task counts
* Date/time formatted to local timezone
* Clean, minimal responsive UI

## Testing
* Backend tests with Jest for authentication and RBAC logic.
* Frontend component and state tests with Jest/Karma.
* Basic seed data and roles auto-generated on first run.

## Future Considerations
* Refresh tokens & advanced JWT handling
* Role delegation and custom permissions
* Full drag-and-drop task management
* Improved task filters and analytics
* Organization admin panel
* RBAC caching for performance

## License

This project was built as part of a full stack coding challenge.
MIT License © 2025 Benjamin McElvain
