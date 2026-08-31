const { body, param, query } = require('express-validator');

/**
 * Custom validator to reject past dates.
 * A dueDate is rejected if it is earlier than today (start of current day).
 */
const isNotPastDate = (value) => {
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    throw new Error('Due date cannot be earlier than today');
  }
  return true;
};

/**
 * Validation rules for creating a task (POST /tasks)
 * Requirements:
 * - title: required, must be a non-empty string
 * - description: optional, but if present must be a string
 * - completed: optional, but if present must be a boolean
 * - dueDate: optional, but if present must be a valid ISO 8601 date and not earlier than today
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
    .withMessage('Due date must be a valid ISO 8601 date (e.g. 2026-08-31 or 2026-08-31T12:00:00.000Z)')
    .bail()
    .custom(isNotPastDate),
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
    .withMessage('Due date must be a valid ISO 8601 date (e.g. 2026-08-31 or 2026-08-31T12:00:00.000Z)')
    .bail()
    .custom(isNotPastDate),
];

/**
 * Validation rule for task ID parameter (GET /tasks/:id, PUT /tasks/:id, DELETE /tasks/:id)
 * Validates that :id is a 24-character hexadecimal MongoDB ObjectId
 */
const taskIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format. Task ID must be a valid 24-character hexadecimal MongoDB ObjectId'),
];

/**
 * Validation rules for GET /tasks query parameters
 * Validates that completed query parameter is 'true' or 'false' only
 */
const getTasksQueryValidation = [
  query('completed')
    .optional()
    .isIn(['true', 'false'])
    .withMessage("Completed query parameter must be 'true' or 'false'"),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  getTasksQueryValidation,
};
