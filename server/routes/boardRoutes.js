const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  getMembers,
  inviteMember,
  removeMember,
  getActivity,
  verifyBoardAccess,
  verifyBoardOwner,
} = require('../controllers/boardController');
const { getTasks, createTask } = require('../controllers/taskController');

const router = express.Router();

router.use(authMiddleware);

// Board CRUD
router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', verifyBoardAccess, getBoard);
router.put('/:id', verifyBoardOwner, updateBoard);
router.delete('/:id', verifyBoardOwner, deleteBoard);

// Task routes for board
router.get('/:id/tasks', verifyBoardAccess, getTasks);
router.post('/:id/tasks', verifyBoardAccess, createTask);

// Member management
router.get('/:id/members', verifyBoardAccess, getMembers);
router.post('/:id/members', verifyBoardOwner, inviteMember);
router.delete('/:id/members/:userId', verifyBoardOwner, removeMember);

// Activity log
router.get('/:id/activity', verifyBoardAccess, getActivity);

module.exports = router;
