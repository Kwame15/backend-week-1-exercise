const express = require('express');
const { body, param } = require('express-validator');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

/**
 * Validation rules for creating a task (POST /tasks)
 * Requirements:
 * - title: required, must be a non-empty string
 * - description: optional, but if present must be a string
 * - completed: optional, but if present must be a boolean
 * - dueDate: optional, but if present must be a valid ISO 8601 date
 */
const createTaskValidation = [
  body('title')
    .exists({ checkNull: true, checkFalsy: false })
    .withMessage('Title is required')
    .bail()
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty or contain only whitespace'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string')
    .trim(),

  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean (true or false)'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date (e.g. 2026-08-31 or 2026-08-31T12:00:00.000Z)'),
];

/**
 * Validation rules for updating a task (PUT /tasks/:id)
 * Validates fields if present in update payload
 */
const updateTaskValidation = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty or contain only whitespace'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string')
    .trim(),

  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean (true or false)'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date (e.g. 2026-08-31 or 2026-08-31T12:00:00.000Z)'),
];

// Routes mapping

// 1. GET /tasks - Get all tasks (Status: 200 OK)
router.get('/', getAllTasks);

// 2. GET /tasks/:id - Get a single task by ID (Status: 200 OK / 404 Not Found)
router.get('/:id', getTaskById);

// 3. POST /tasks - Create a new task with validation (Status: 201 Created / 400 Bad Request)
router.post('/', createTaskValidation, handleValidationErrors, createTask);

// 4. PUT /tasks/:id - Update a task with validation (Status: 200 OK / 400 Bad Request / 404 Not Found)
router.put('/:id', updateTaskValidation, handleValidationErrors, updateTask);

// 5. DELETE /tasks/:id - Delete a task (Status: 200 OK / 404 Not Found)
router.delete('/:id', deleteTask);

module.exports = router;
