const { validationResult } = require('express-validator');

/**
 * Reusable middleware to handle express-validator validation results.
 * If validation errors exist, responds with 400 Bad Request and error details.
 * Otherwise, calls next() to proceed to the controller.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

module.exports = handleValidationErrors;
