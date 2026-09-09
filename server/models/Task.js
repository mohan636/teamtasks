const mongoose = require('mongoose');

const TASK_STATUSES = ['todo', 'in-progress', 'done'];

const taskSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
