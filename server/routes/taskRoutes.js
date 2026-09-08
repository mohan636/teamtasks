const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

router.use(authMiddleware);

router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
