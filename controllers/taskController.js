const mongoose = require('mongoose');
const Task = require('../models/Task');

// In-memory store fallback when MongoDB is offline
let inMemoryTasks = [];

/**
 * Helper to check if MongoDB is active
 */
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc   Get all tasks (with optional ?completed=true/false query filter)
 * @route  GET /tasks
 * @status 200 OK
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { completed } = req.query;
    const filter = {};
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (isMongoConnected()) {
      const tasks = await Task.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    // In-memory fallback
    let tasks = inMemoryTasks;
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      tasks = tasks.filter((t) => t.completed === isCompleted);
    }

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get a single task by ID
 * @route  GET /tasks/:id
 * @status 200 OK or 404 Not Found
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Task not found with ID: ${id}`,
        });
      }
      return res.status(200).json({
        success: true,
        data: task,
      });
    }

    // In-memory fallback
    const task = inMemoryTasks.find((t) => String(t.id) === String(id) || String(t._id) === String(id));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create a new task
 * @route  POST /tasks
 * @status 201 Created
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, completed, dueDate } = req.body;

    if (isMongoConnected()) {
      const task = await Task.create({
        title,
        description: description || '',
        completed: completed !== undefined ? completed : false,
        dueDate: dueDate ? new Date(dueDate) : null,
      });

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    }

    // In-memory fallback
    const newId = new mongoose.Types.ObjectId().toString();
    const newTask = {
      _id: newId,
      id: newId,
      title,
      description: description || '',
      completed: completed !== undefined ? Boolean(completed) : false,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryTasks.push(newTask);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update an existing task
 * @route  PUT /tasks/:id
 * @status 200 OK or 404 Not Found
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed, dueDate } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (completed !== undefined) updates.completed = completed;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    if (isMongoConnected()) {
      const task = await Task.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Task not found with ID: ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    }

    // In-memory fallback
    const taskIndex = inMemoryTasks.findIndex(
      (t) => String(t.id) === String(id) || String(t._id) === String(id)
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Task not found with ID: ${id}`,
      });
    }

    inMemoryTasks[taskIndex] = {
      ...inMemoryTasks[taskIndex],
      ...updates,
      dueDate: updates.dueDate !== undefined ? (updates.dueDate ? new Date(updates.dueDate).toISOString() : null) : inMemoryTasks[taskIndex].dueDate,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: inMemoryTasks[taskIndex],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete a task
 * @route  DELETE /tasks/:id
 * @status 200 OK or 404 Not Found
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const task = await Task.findByIdAndDelete(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Task not found with ID: ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: task,
      });
    }

    // In-memory fallback
    const taskIndex = inMemoryTasks.findIndex(
      (t) => String(t.id) === String(id) || String(t._id) === String(id)
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Task not found with ID: ${id}`,
      });
    }

    const [deletedTask] = inMemoryTasks.splice(taskIndex, 1);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

