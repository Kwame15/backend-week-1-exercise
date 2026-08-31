# Task Manager API - Extended Request Validation

This project implements extended request validation using `express-validator` for the Task Manager CRUD API (Node.js, Express, MongoDB) for Codetrain Africa.

---

## 📌 Features & Validation Rules

All validation chains have been extracted into a dedicated module: [`validators/taskValidators.js`](./validators/taskValidators.js).

### 1. Endpoint Validations

#### **`POST /tasks` (Create Task)**
- `title`: **Required**, must be a non-empty string.
- `description`: **Optional**, if present must be a string.
- `completed`: **Optional**, if present must be a boolean (`true` or `false`).
- `dueDate`: **Optional**, if present must be a valid ISO 8601 date string and **cannot be earlier than today** (rejects past dates).

#### **`PUT /tasks/:id` (Update Task)**
- `id` (param): **Required**, must be a valid 24-character hexadecimal MongoDB ObjectId (`param('id').isMongoId()`).
- `title`: **Optional**, if present must be a non-empty string.
- `description`: **Optional**, if present must be a string.
- `completed`: **Optional**, if present must be a boolean.
- `dueDate`: **Optional**, if present must be a valid ISO 8601 date string and **cannot be earlier than today**.

#### **`GET /tasks/:id` (Get Single Task)**
- `id` (param): **Required**, must be a valid 24-character hexadecimal MongoDB ObjectId (`param('id').isMongoId()`). Invalid ID format returns `400 Bad Request` before querying the database.

#### **`DELETE /tasks/:id` (Delete Task)**
- `id` (param): **Required**, must be a valid 24-character hexadecimal MongoDB ObjectId (`param('id').isMongoId()`). Invalid ID format returns `400 Bad Request`.

#### **`GET /tasks` (Get All Tasks & Query Filter)**
- `completed` (query): **Optional**, must only be `'true'` or `'false'`. Any other value returns `400 Bad Request`.

### 2. Reusable Validation Middleware (`handleValidationErrors`)
- Checks `validationResult(req)` from `express-validator`.
- If validation errors exist, halts request execution and responds with status **`400 Bad Request`** and a formatted error array.
- If no errors, calls `next()` to proceed to the controller.

---

## 📊 HTTP Status Codes

| Action | Route | Success Code | Error Code |
| :--- | :--- | :--- | :--- |
| Create Task | `POST /tasks` | `201 Created` | `400 Bad Request` |
| Get All Tasks | `GET /tasks` | `200 OK` | `400 Bad Request` (invalid query param) / `500 Server Error` |
| Get Task by ID | `GET /tasks/:id` | `200 OK` | `400 Bad Request` (invalid Mongo ID) / `404 Not Found` |
| Update Task | `PUT /tasks/:id` | `200 OK` | `400 Bad Request` / `404 Not Found` |
| Delete Task | `DELETE /tasks/:id` | `200 OK` | `400 Bad Request` / `404 Not Found` |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already configured by default):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_manager_db
NODE_ENV=development
```

### 3. Start the Server
- **Development mode (auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

Server will run on: `http://localhost:5000`

---

## 🧪 Testing with Postman

The Postman collection is located at [`postman/TaskManager_API.postman_collection.json`](./postman/TaskManager_API.postman_collection.json). It demonstrates:
1. **Valid create** (`POST /tasks` -> `201 Created`)
2. **Invalid dueDate (past date)** (`POST /tasks` -> `400 Bad Request`)
3. **Invalid ID format on GET** (`GET /tasks/invalid-id` -> `400 Bad Request`)
4. **Invalid ID format on PUT** (`PUT /tasks/invalid-id` -> `400 Bad Request`)
5. **Invalid ID format on DELETE** (`DELETE /tasks/invalid-id` -> `400 Bad Request`)
6. **Invalid completed query value** (`GET /tasks?completed=not_a_boolean` -> `400 Bad Request`)
7. **Valid query filter** (`GET /tasks?completed=true` -> `200 OK`)
8. **404 Not Found** on non-existent valid Mongo ID (`GET /tasks/507f1f77bcf86cd799439011` -> `404 Not Found`)
9. **Valid updates and deletes** (`PUT /tasks/:id`, `DELETE /tasks/:id` -> `200 OK`)

---

## ⚡ Automated Tests

To run the automated test suite:
```bash
npm test
```
This runs 31 comprehensive test assertions covering all assignment requirements.
