const Activity = require('../models/Activity');

const logActivity = async ({
  boardId,
  userId,
  action,
  taskId,
  metadata = {},
}) => {
  try {
    await Activity.create({
      boardId,
      userId,
      action,
      taskId: taskId || undefined,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
