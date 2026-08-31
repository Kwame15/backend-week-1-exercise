# Task Manager API - Request Validation with express-validator

This project adds request validation using `express-validator` to the Task Manager CRUD API (Node.js, Express, MongoDB) for Codetrain Africa.

---

## 📌 Features & Validation Rules

### 1. Request Validation Chains (`express-validator`)

#### **`POST /tasks` (Create Task)**
- `title`: **Required**, must be a non-empty string.
- `description`: **Optional**, if present must be a string.
- `completed`: **Optional**, if present must be a boolean (`true` or `false`).
- `dueDate`: **Optional**, if present must be a valid ISO 8601 date string (e.g., `2026-09-05` or `2026-09-05T18:00:00.000Z`).

#### **`PUT /tasks/:id` (Update Task)**
- `title`: **Optional**, if present must be a non-empty string.
- `description`: **Optional**, if present must be a string.
- `completed`: **Optional**, if present must be a boolean.
- `dueDate`: **Optional**, if present must be a valid ISO 8601 date string.

### 2. Reusable Validation Middleware (`handleValidationErrors`)
- Checks `validationResult(req)`.
- If validation errors exist, halts request execution and responds with status **`400 Bad Request`** and a clean list of error objects.
- If no errors, calls `next()` to proceed to the controller.

---

## 📊 Suggested HTTP Status Codes

| Action | Route | Success Code | Error Code |
| :--- | :--- | :--- | :--- |
| Create Task | `POST /tasks` | `201 Created` | `400 Bad Request` |
| Get All Tasks | `GET /tasks` | `200 OK` | `500 Server Error` |
| Get Task by ID | `GET /tasks/:id` | `200 OK` | `404 Not Found` |
| Update Task | `PUT /tasks/:id` | `200 OK` | `400 Bad Request` / `404 Not Found` |
| Delete Task | `DELETE /tasks/:id` | `200 OK` | `404 Not Found` |

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

You can import the ready-to-use Postman collection from `postman/TaskManager_API.postman_collection.json` or test manually with the following examples:

### Test 1: Valid POST Request (Expected: `201 Created`)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "title": "Complete Codetrain Backend Assignment",
    "description": "Add express-validator to task routes",
    "completed": false,
    "dueDate": "2026-09-05T18:00:00.000Z"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Task created successfully",
    "data": {
      "id": "1",
      "title": "Complete Codetrain Backend Assignment",
      "description": "Add express-validator to task routes",
      "completed": false,
      "dueDate": "2026-09-05T18:00:00.000Z",
      "createdAt": "2026-08-31T21:40:00.000Z",
      "updatedAt": "2026-08-31T21:40:00.000Z"
    }
  }
  ```

---

### Test 2: Invalid POST Request - Missing Title (Expected: `400 Bad Request`)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "description": "This payload has no title",
    "completed": false
  }
  ```
- **Response:** `400 Bad Request`
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
  ```

---

### Test 3: Invalid POST Request - Wrong Type for `completed` (Expected: `400 Bad Request`)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "title": "Invalid Completed Field Test",
    "completed": "not-a-boolean"
  }
  ```
- **Response:** `400 Bad Request`
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      {
        "field": "completed",
        "message": "Completed must be a boolean (true or false)",
        "value": "not-a-boolean"
      }
    ]
  }
  ```

---

### Test 4: Invalid POST Request - Invalid `dueDate` Format (Expected: `400 Bad Request`)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "title": "Invalid Due Date Test",
    "dueDate": "tomorrow-afternoon"
  }
  ```
- **Response:** `400 Bad Request`
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      {
        "field": "dueDate",
        "message": "Due date must be a valid ISO 8601 date (e.g. 2026-08-31 or 2026-08-31T12:00:00.000Z)",
        "value": "tomorrow-afternoon"
      }
    ]
  }
  ```

---

## ⚡ Automated Tests

To run the automated test suite that validates all endpoints and edge cases:
```bash
npm test
```
