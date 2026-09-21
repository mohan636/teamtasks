const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');
const logActivity = require('../utils/logActivity');
const { isValidId, isBoardOwner, canAccessBoard } = require('../utils/boardAccess');

// Middleware to verify user can access the board (owner or member)
exports.verifyBoardAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID',
      });
    }

    const board = await Board.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    if (!canAccessBoard(board, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this board',
      });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify board access',
    });
  }
};

// Middleware to verify user is the owner of the board
exports.verifyBoardOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID',
      });
    }

    const board = await Board.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the board owner can perform this action',
      });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify board ownership',
    });
  }
};

// Legacy middleware name for backward compatibility
exports.verifyBoardOwnership = exports.verifyBoardAccess;

// GET /api/boards - List all boards where user is owner or member
exports.getBoards = async (req, res) => {
  try {
    const userId = req.user._id;

    const boards = await Board.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    const boardIds = boards.map((b) => b._id);

    // Aggregate task counts per board
    const taskCounts = await Task.aggregate([
      { $match: { boardId: { $in: boardIds } } },
      {
        $group: {
          _id: '$boardId',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = {};
    taskCounts.forEach((tc) => {
      countMap[String(tc._id)] = {
        total: tc.total,
        completed: tc.completed,
      };
    });

    const enrichedBoards = boards.map((board) => {
      const counts = countMap[String(board._id)] || { total: 0, completed: 0 };
      const boardObj = board.toObject();
      return {
        ...boardObj,
        taskCount: counts.total,
        completedCount: counts.completed,
        isOwner: String(board.owner._id || board.owner) === String(userId),
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedBoards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boards',
    });
  }
};

// GET /api/boards/:id - Get single board details
exports.getBoard = async (req, res) => {
  try {
    const board = req.board;
    const userId = req.user._id;

    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ boardId: board._id }),
      Task.countDocuments({ boardId: board._id, status: 'done' }),
    ]);

    const boardObj = board.toObject();
    res.status(200).json({
      success: true,
      data: {
        ...boardObj,
        taskCount: totalTasks,
        completedCount: completedTasks,
        isOwner: String(board.owner._id || board.owner) === String(userId),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board',
    });
  }
};

// POST /api/boards - Create board
exports.createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Board title is required',
      });
    }

    const board = await Board.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      owner: req.user._id,
      members: [],
    });

    await board.populate('owner', 'name email');

    await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: 'BOARD_CREATED',
      metadata: { boardTitle: board.title },
    });

    const boardObj = board.toObject();

    res.status(201).json({
      success: true,
      data: {
        ...boardObj,
        taskCount: 0,
        completedCount: 0,
        isOwner: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create board',
    });
  }
};

// PUT /api/boards/:id - Rename/update board (Owner only)
exports.updateBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Board title cannot be empty',
        });
      }
      const oldTitle = req.board.title;
      req.board.title = title.trim();

      if (oldTitle !== req.board.title) {
        await logActivity({
          boardId: req.board._id,
          userId: req.user._id,
          action: 'BOARD_RENAMED',
          metadata: { oldTitle, newTitle: req.board.title },
        });
      }
    }

    if (description !== undefined) {
      req.board.description = description ? description.trim() : '';
    }

    await req.board.save();

    res.status(200).json({
      success: true,
      data: req.board,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update board',
    });
  }
};

// DELETE /api/boards/:id - Delete board and all its tasks (Owner only)
exports.deleteBoard = async (req, res) => {
  try {
    const boardId = req.board._id;

    await Promise.all([
      Board.deleteOne({ _id: boardId }),
      Task.deleteMany({ boardId }),
      Activity.deleteMany({ boardId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Board and all associated tasks deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete board',
    });
  }
};

// GET /api/boards/:id/members - List members
exports.getMembers = async (req, res) => {
  try {
    const board = req.board;

    res.status(200).json({
      success: true,
      data: {
        owner: board.owner,
        members: board.members,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board members',
    });
  }
};

// POST /api/boards/:id/members - Invite/add member (Owner only)
exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member email is required',
      });
    }

    const userToInvite = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('name email');

    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email',
      });
    }

    const board = req.board;
    const userIdStr = String(userToInvite._id);

    // Check if user is already owner
    if (String(board.owner._id || board.owner) === userIdStr) {
      return res.status(400).json({
        success: false,
        message: 'User is already the owner of this board',
      });
    }

    // Check if user is already member
    const alreadyMember = board.members.some(
      (m) => String(m.user._id || m.user) === userIdStr
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this board',
      });
    }

    board.members.push({ user: userToInvite._id, role: 'member' });
    await board.save();

    await board.populate('members.user', 'name email');

    await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: 'MEMBER_INVITED',
      metadata: {
        invitedUserName: userToInvite.name,
        invitedUserEmail: userToInvite.email,
      },
    });

    res.status(200).json({
      success: true,
      message: `${userToInvite.name} added as member`,
      data: {
        owner: board.owner,
        members: board.members,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
    });
  }
};

// DELETE /api/boards/:id/members/:userId - Remove member (Owner only)
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const board = req.board;

    const memberToRemove = board.members.find(
      (m) => String(m.user._id || m.user) === String(userId)
    );

    const initialLength = board.members.length;
    board.members = board.members.filter(
      (m) => String(m.user._id || m.user) !== String(userId)
    );

    if (board.members.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Member not found on this board',
      });
    }

    await board.save();
    await board.populate('members.user', 'name email');

    const removedUserName =
      memberToRemove?.user?.name || memberToRemove?.user?.email || 'Member';

    await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: 'MEMBER_REMOVED',
      metadata: {
        removedUserName,
        removedUserId: userId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Member removed',
      data: {
        owner: board.owner,
        members: board.members,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
    });
  }
};

// GET /api/boards/:id/activity - Get activity history (Newest first)
exports.getActivity = async (req, res) => {
  try {
    const boardId = req.board._id;

    const activities = await Activity.find({ boardId })
      .populate('userId', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(60);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
    });
  }
};
