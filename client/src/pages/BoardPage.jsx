import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  X,
  Users,
  Activity as ActivityIcon,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TaskColumn from '../components/TaskColumn';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import MemberModal from '../components/MemberModal';
import ActivityDrawer from '../components/ActivityDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import axiosClient from '../api/axiosClient';
import { isTaskOverdue, isDueToday, isDueThisWeek } from '../utils/dateUtils';
import './BoardPage.css';

const STATUS_ORDER = ['todo', 'in-progress', 'done'];

const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Drawers state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalInitialStatus, setModalInitialStatus] = useState('todo');
  const [savingTask, setSavingTask] = useState(false);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(false);

  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'todo' | 'in-progress' | 'done'
  const [dueDateFilter, setDueDateFilter] = useState('all'); // 'all' | 'overdue' | 'today' | 'week' | 'none'

  // Drag & drop state
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);
      const [boardRes, tasksRes] = await Promise.all([
        axiosClient.get(`/boards/${id}`),
        axiosClient.get(`/boards/${id}/tasks`),
      ]);

      setBoard(boardRes.data.data);
      setRenameTitle(boardRes.data.data.title);
      setTasks(tasksRes.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Task save handler (Create / Edit)
  const handleSaveTask = async (taskData) => {
    setSavingTask(true);
    try {
      if (editingTask) {
        const { data } = await axiosClient.put(`/tasks/${editingTask._id}`, taskData);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? data.data : t))
        );
        toast.success('Task updated');
      } else {
        const { data } = await axiosClient.post(`/boards/${id}/tasks`, taskData);
        setTasks((prev) => [data.data, ...prev]);
        toast.success('Task created');
      }
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  // Task delete handler
  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    setDeletingTask(true);
    try {
      await axiosClient.delete(`/tasks/${taskToDelete._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      toast.success('Task deleted');
      setTaskToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingTask(false);
    }
  };

  // Board rename handler
  const handleRenameBoard = async (e) => {
    e?.preventDefault();
    if (!renameTitle.trim() || renameTitle.trim() === board?.title) {
      setIsRenamingBoard(false);
      return;
    }

    try {
      const { data } = await axiosClient.put(`/boards/${id}`, {
        title: renameTitle.trim(),
      });
      setBoard((prev) => ({ ...prev, title: data.data.title }));
      setIsRenamingBoard(false);
      toast.success('Board updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update board');
    }
  };

  // Board delete handler
  const handleDeleteBoardConfirm = async () => {
    if (!boardToDelete) return;
    setDeletingBoard(true);
    try {
      await axiosClient.delete(`/boards/${boardToDelete._id}`);
      toast.success('Board deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board');
      setDeletingBoard(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find task being dragged
    const activeItem = tasks.find((t) => t._id === activeId);
    if (!activeItem) return;

    // Determine target status
    let targetStatus = null;
    if (STATUS_ORDER.includes(overId)) {
      targetStatus = overId;
    } else {
      const overItem = tasks.find((t) => t._id === overId);
      if (overItem) {
        targetStatus = overItem.status;
      }
    }

    if (targetStatus && activeItem.status !== targetStatus) {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === activeId ? { ...t, status: targetStatus } : t
        )
      );
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    const activeId = active.id;
    const originalStatus = active.data.current?.task?.status;

    if (!over) {
      if (originalStatus) {
        setTasks((prev) =>
          prev.map((t) => (t._id === activeId ? { ...t, status: originalStatus } : t))
        );
      }
      return;
    }

    const overId = over.id;
    const currentTask = tasks.find((t) => t._id === activeId);
    if (!currentTask) return;

    let targetStatus = currentTask.status;

    if (STATUS_ORDER.includes(overId)) {
      targetStatus = overId;
    } else {
      const overItem = tasks.find((t) => t._id === overId);
      if (overItem) {
        targetStatus = overItem.status;
      }
    }

    if (originalStatus && originalStatus !== targetStatus) {
      // Optimistically update
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, status: targetStatus } : t))
      );

      try {
        await axiosClient.put(`/tasks/${activeId}`, { status: targetStatus });
        toast.success(`Task moved to ${STATUS_LABELS[targetStatus] || targetStatus}`);
      } catch (err) {
        // Rollback state on error
        setTasks((prev) =>
          prev.map((t) => (t._id === activeId ? { ...t, status: originalStatus } : t))
        );
        toast.error(err.response?.data?.message || 'Failed to move task');
      }
    } else if (originalStatus && originalStatus === targetStatus) {
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, status: originalStatus } : t))
      );
    }
  };

  const handleDragCancel = (event) => {
    const { active } = event;
    setActiveTask(null);
    const activeId = active?.id;
    const originalStatus = active?.data?.current?.task?.status;
    if (activeId && originalStatus) {
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, status: originalStatus } : t))
      );
    }
  };

  // Quick Add Task for specific column
  const handleQuickAddTask = (status) => {
    setEditingTask(null);
    setModalInitialStatus(status);
    setTaskModalOpen(true);
  };

  // Filter tasks based on search, status, and due date
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter (title & description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Due date filter
      if (dueDateFilter === 'overdue') {
        if (!isTaskOverdue(task.dueDate, task.status)) return false;
      } else if (dueDateFilter === 'today') {
        if (!isDueToday(task.dueDate)) return false;
      } else if (dueDateFilter === 'week') {
        if (!isDueThisWeek(task.dueDate)) return false;
      } else if (dueDateFilter === 'none') {
        if (task.dueDate) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, dueDateFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || dueDateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDueDateFilter('all');
  };

  const tasksByStatus = (status) =>
    filteredTasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <>
        <Navbar currentWorkspace="Loading..." />
        <main className="board-page container">
          <div className="board-page-header">
            <div className="skeleton" style={{ height: '32px', width: '240px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '18px', width: '180px' }} />
          </div>
          <div className="board-columns">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="task-column">
                <div className="skeleton" style={{ height: '40px', margin: '12px' }} />
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skeleton" style={{ height: '80px', width: '100%' }} />
                  <div className="skeleton" style={{ height: '80px', width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error && !board) {
    return (
      <>
        <Navbar currentWorkspace="Error" />
        <div className="container board-page">
          <div className="board-error-container">
            <AlertTriangle size={36} className="board-error-icon" />
            <h2>Board not found</h2>
            <p>{error || 'The board you requested could not be found or you do not have permission to view it.'}</p>
            <Link to="/" className="btn-primary">
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const allMembers = [
    board.owner ? { ...board.owner, isOwner: true } : null,
    ...(board.members || []).map((m) => ({ ...(m.user || {}), isOwner: false })),
  ].filter(Boolean);

  return (
    <>
      <Navbar currentWorkspace={board?.title} />
      <main className="board-page container">
        {/* Top breadcrumb navigation */}
        <div className="board-breadcrumb-nav">
          <Link to="/" className="board-back-link">
            <ArrowLeft size={14} />
            <span>Boards</span>
          </Link>
          <span className="board-breadcrumb-slash">/</span>
          <span className="board-breadcrumb-current">{board?.title}</span>
        </div>

        {/* Board Header */}
        <div className="board-page-header">
          <div className="board-page-header-left">
            {isRenamingBoard ? (
              <form onSubmit={handleRenameBoard} className="board-rename-form">
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onBlur={handleRenameBoard}
                  autoFocus
                  className="board-rename-input"
                />
              </form>
            ) : (
              <div className="board-title-row">
                <h1 className="board-title">{board?.title}</h1>
              </div>
            )}
            <p className="board-subtitle">
              Manage tasks and keep your team on track
            </p>
          </div>

          <div className="board-page-header-actions">
            {/* Member Avatars Stack */}
            <div
              className="board-members-stack"
              onClick={() => setMemberModalOpen(true)}
              title="Manage board members"
            >
              {allMembers.slice(0, 3).map((m, idx) => (
                <div
                  key={m._id || idx}
                  className={`board-member-avatar-pill ${m.isOwner ? 'owner' : ''}`}
                  title={`${m.name} (${m.isOwner ? 'Owner' : 'Member'})`}
                >
                  {getInitials(m.name)}
                </div>
              ))}
              {allMembers.length > 3 && (
                <div className="board-member-avatar-pill more">
                  +{allMembers.length - 3}
                </div>
              )}
              <button
                className="btn-ghost btn-icon board-invite-btn"
                aria-label="Invite member"
                title="Invite people"
              >
                <Users size={16} />
              </button>
            </div>

            {/* Activity Log Button */}
            <button
              className="btn-secondary btn-sm"
              onClick={() => setActivityDrawerOpen(true)}
              title="View board activity log"
            >
              <ActivityIcon size={15} />
              <span>Activity</span>
            </button>

            {/* Add Task Button */}
            <button
              className="btn-primary btn-sm"
              onClick={() => {
                setEditingTask(null);
                setModalInitialStatus('todo');
                setTaskModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>

            {/* Board Overflow Menu (Rename / Delete if Owner) */}
            {board?.isOwner && (
              <div className="board-menu-wrapper">
                <button
                  className="btn-ghost btn-icon"
                  onClick={() => setBoardMenuOpen(!boardMenuOpen)}
                  aria-label="Board options"
                >
                  <MoreVertical size={16} />
                </button>

                {boardMenuOpen && (
                  <div className="board-card-dropdown">
                    <button
                      className="board-card-dropdown-item"
                      onClick={() => {
                        setBoardMenuOpen(false);
                        setIsRenamingBoard(true);
                      }}
                    >
                      <Edit2 size={14} />
                      <span>Rename Board</span>
                    </button>
                    <button
                      className="board-card-dropdown-item destructive"
                      onClick={() => {
                        setBoardMenuOpen(false);
                        setBoardToDelete(board);
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete Board</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="board-toolbar">
          <div className="board-search-wrapper">
            <Search size={15} className="board-search-icon" />
            <input
              type="text"
              className="board-search-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="board-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="board-filters-group">
            {/* Status Filter */}
            <div className="board-filter-item">
              <span className="board-filter-label">Status:</span>
              <select
                className="board-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Due Date Filter */}
            <div className="board-filter-item">
              <Calendar size={13} className="board-filter-icon" />
              <select
                className="board-filter-select"
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
              >
                <option value="all">All Due Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="week">Due this week</option>
                <option value="none">No due date</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                className="btn-ghost btn-sm board-clear-filters"
                onClick={clearFilters}
              >
                <Filter size={13} />
                <span>Clear filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag & Drop Board Columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="board-columns">
            {STATUS_ORDER.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasksByStatus(status)}
                onEdit={(task) => {
                  setEditingTask(task);
                  setTaskModalOpen(true);
                }}
                onDeleteClick={(task) => setTaskToDelete(task)}
                onQuickAddTask={handleQuickAddTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="task-card-drag-overlay">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDeleteClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Task Add / Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        initialStatus={modalInitialStatus}
        loading={savingTask}
      />

      {/* Member Management Modal */}
      <MemberModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        boardId={id}
        isOwner={board?.isOwner}
        onMemberUpdated={fetchBoardData}
      />

      {/* Activity Log Drawer */}
      <ActivityDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        boardId={id}
      />

      {/* Confirm Delete Task Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete task?"
        description={
          taskToDelete
            ? `Are you sure you want to delete "${taskToDelete.title}"?`
            : ''
        }
        confirmText="Delete"
        isDestructive={true}
        loading={deletingTask}
        onConfirm={handleDeleteTaskConfirm}
        onClose={() => setTaskToDelete(null)}
      />

      {/* Confirm Delete Board Dialog */}
      <ConfirmDialog
        isOpen={!!boardToDelete}
        title="Delete board?"
        description={
          boardToDelete
            ? `Deleting "${boardToDelete.title}" will also remove all tasks associated with this board. This action cannot be undone.`
            : ''
        }
        confirmText="Delete board"
        isDestructive={true}
        loading={deletingBoard}
        onConfirm={handleDeleteBoardConfirm}
        onClose={() => setBoardToDelete(null)}
      />
    </>
  );
};

export default BoardPage;
