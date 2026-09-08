const mongoose = require('mongoose');
const Board = require('../models/Board');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ownerId = (board) => board.owner._id || board.owner;

const isBoardOwner = (board, userId) =>
  String(ownerId(board)) === String(userId);

const isBoardMember = (board, userId) =>
  board.members.some((m) => String(m.user._id || m.user) === String(userId));

const canAccessBoard = (board, userId) =>
  isBoardOwner(board, userId) || isBoardMember(board, userId);

const findAccessibleBoard = async (boardId, userId) => {
  if (!isValidId(boardId)) return null;

  return Board.findOne({
    _id: boardId,
    $or: [{ owner: userId }, { 'members.user': userId }],
  });
};

module.exports = {
  isValidId,
  isBoardOwner,
  isBoardMember,
  canAccessBoard,
  findAccessibleBoard,
};
