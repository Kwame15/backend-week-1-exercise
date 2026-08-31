const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route - API documentation/overview
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Task Manager API',
    version: '1.0.0',
    endpoints: {
      'GET /tasks': 'Retrieve all tasks (200 OK)',
      'GET /tasks/:id': 'Retrieve a single task (200 OK / 404 Not Found)',
      'POST /tasks': 'Create a new task with validation (201 Created / 400 Bad Request)',
      'PUT /tasks/:id': 'Update an existing task with validation (200 OK / 400 Bad Request / 404 Not Found)',
      'DELETE /tasks/:id': 'Delete a task (200 OK / 404 Not Found)',
    },
  });
});

// Mount Routes
app.use('/tasks', taskRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server if not imported as a module in tests
if (process.env.NODE_ENV !== 'test_env') {
  app.listen(PORT, () => {
    console.log(`🚀 Task Manager API server running on http://localhost:${PORT}`);
    console.log(`📝 Test the API with Postman or run npm test`);
  });
}

module.exports = app;
