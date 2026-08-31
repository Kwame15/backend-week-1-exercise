const express = require('express');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  getTasksQueryValidation,
} = require('../validators/taskValidators');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// Routes mapping

// 1. GET /tasks - Get all tasks with optional query filter (Status: 200 OK / 400 Bad Request)
router.get('/', getTasksQueryValidation, handleValidationErrors, getAllTasks);

// 2. GET /tasks/:id - Get a single task by ID (Status: 200 OK / 400 Bad Request / 404 Not Found)
router.get('/:id', taskIdValidation, handleValidationErrors, getTaskById);

// 3. POST /tasks - Create a new task with validation (Status: 201 Created / 400 Bad Request)
router.post('/', createTaskValidation, handleValidationErrors, createTask);

// 4. PUT /tasks/:id - Update a task with validation (Status: 200 OK / 400 Bad Request / 404 Not Found)
router.put('/:id', taskIdValidation, updateTaskValidation, handleValidationErrors, updateTask);

// 5. DELETE /tasks/:id - Delete a task (Status: 200 OK / 400 Bad Request / 404 Not Found)
router.delete('/:id', taskIdValidation, handleValidationErrors, deleteTask);

module.exports = router;

