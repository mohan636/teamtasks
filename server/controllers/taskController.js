const Task = require('../models/Task');
const { TASK_STATUSES } = require('../models/Task');
const Board = require('../models/Board');
const logActivity = require('../utils/logActivity');
const { canAccessBoard, isValidId } = require('../utils/boardAccess');

const isValidDateString = (dateStr) => {
  if (!dateStr) return true;
  const regex = /^(\d{4})-(\d{2})-(\d{2})/;
  const str = String(dateStr);
  const match = str.match(regex);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
};

// Helper to verify task and board access
const verifyTaskBoardAccess = async (taskId, userId) => {
  if (!isValidId(taskId)) return null;

  const task = await Task.findById(taskId);
  if (!task) return null;

  const board = await Board.findById(task.boardId);
  if (!board) return null;

  if (!canAccessBoard(board, userId)) return null;

  return { task, board };
};

// GET /api/boards/:id/tasks - Get all tasks for a board
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ boardId: req.board._id }).sort({
      position: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
    });
  }
};

// POST /api/boards/:id/tasks - Create task on a board
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
      });
    }

    if (!isValidDateString(dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date',
      });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date',
      });
    }

    if (status && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status',
      });
    }

    // Place newly created tasks at the top of the column
    const targetStatus = status || 'todo';
    const topTask = await Task.findOne({
      boardId: req.board._id,
      status: targetStatus,
    }).sort({ position: 1 });

    const position =
      topTask && typeof topTask.position === 'number'
        ? topTask.position - 1
        : 0;

    const task = await Task.create({
      boardId: req.board._id,
      title: title.trim(),
      description: description?.trim() || '',
      status: targetStatus,
      dueDate: parsedDueDate,
      position,
    });

    await logActivity({
      boardId: req.board._id,
      userId: req.user._id,
      action: 'TASK_CREATED',
      taskId: task._id,
      metadata: {
        taskTitle: task.title,
        status: task.status,
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
};

// PUT /api/boards/:id/tasks/reorder - Reorder multiple tasks on a board
exports.reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks list is required',
      });
    }

    const bulkOps = tasks.map((t, idx) => ({
      updateOne: {
        filter: { _id: t._id, boardId: req.board._id },
        update: {
          $set: {
            ...(t.status ? { status: t.status } : {}),
            position: typeof t.position === 'number' ? t.position : idx,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reorder tasks',
    });
  }
};

// PUT /api/tasks/:id - Update task or status
exports.updateTask = async (req, res) => {
  try {
    const result = await verifyTaskBoardAccess(req.params.id, req.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    const { task, board } = result;
    const { title, description, dueDate, status, position } = req.body;

    let isStatusChange = false;
    let oldStatus = task.status;
    let otherChanges = false;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      if (task.title !== title.trim()) {
        task.title = title.trim();
        otherChanges = true;
      }
    }

    if (description !== undefined) {
      if (task.description !== description.trim()) {
        task.description = description.trim();
        otherChanges = true;
      }
    }

    if (status !== undefined) {
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task status',
        });
      }
      if (task.status !== status) {
        isStatusChange = true;
        oldStatus = task.status;
        task.status = status;
      }
    }

    if (dueDate !== undefined) {
      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Due date is required',
        });
      }
      if (!isValidDateString(dueDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date',
        });
      }
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date',
        });
      }
      if (!task.dueDate || new Date(task.dueDate).getTime() !== parsedDueDate.getTime()) {
        task.dueDate = parsedDueDate;
        otherChanges = true;
      }
    }

    if (position !== undefined && typeof position === 'number') {
      if (task.position !== position) {
        task.position = position;
        otherChanges = true;
      }
    }

    await task.save();

    // Log activity accordingly
    if (isStatusChange) {
      await logActivity({
        boardId: board._id,
        userId: req.user._id,
        action: 'TASK_MOVED',
        taskId: task._id,
        metadata: {
          taskTitle: task.title,
          fromStatus: oldStatus,
          toStatus: task.status,
        },
      });
    }

    if (otherChanges && !isStatusChange) {
      await logActivity({
        boardId: board._id,
        userId: req.user._id,
        action: 'TASK_UPDATED',
        taskId: task._id,
        metadata: {
          taskTitle: task.title,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

// DELETE /api/tasks/:id - Delete task
exports.deleteTask = async (req, res) => {
  try {
    const result = await verifyTaskBoardAccess(req.params.id, req.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    const { task, board } = result;
    const taskTitle = task.title;

    await Task.deleteOne({ _id: task._id });

    await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: 'TASK_DELETED',
      metadata: {
        taskTitle,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
};
