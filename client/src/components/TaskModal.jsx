import { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft, CheckSquare } from 'lucide-react';
import './TaskModal.css';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const isValidDueDate = (dateStr) => {
  if (!dateStr) return true;
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(regex);
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

const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  task = null,
  initialStatus = 'todo',
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setStatus(task.status || 'todo');
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus(initialStatus || 'todo');
    }
    setError('');
  }, [task, initialStatus, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    setDueDate(val);
    if (val) {
      if (!isValidDueDate(val)) {
        setError('Please enter a valid due date.');
      } else if (error === 'Please enter a valid due date.' || error === 'Due date is required') {
        setError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }
    if (!isValidDueDate(dueDate)) {
      setError('Please enter a valid due date.');
      return;
    }
    setError('');
    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate,
      status: task ? status : 'todo',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={!loading ? onClose : undefined}>
      <div
        className="modal task-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="task-modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          {!loading && (
            <button
              className="btn-ghost btn-icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error === 'Task title is required' && e.target.value.trim()) {
                  setError('');
                }
              }}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">
              <span className="form-label-with-icon">
                <AlignLeft size={13} />
                Description
              </span>
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details, context, or checklist..."
            />
          </div>

          {task ? (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-due-date">
                  <span className="form-label-with-icon">
                    <Calendar size={13} />
                    Due Date
                  </span>
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={dueDate}
                  onChange={handleDateChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-status">
                  <span className="form-label-with-icon">
                    <CheckSquare size={13} />
                    Status
                  </span>
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="task-due-date">
                <span className="form-label-with-icon">
                  <Calendar size={13} />
                  Due Date
                </span>
              </label>
              <input
                id="task-due-date"
                type="date"
                min="1900-01-01"
                max="2099-12-31"
                value={dueDate}
                onChange={handleDateChange}
                required
              />
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? task
                  ? 'Saving...'
                  : 'Creating...'
                : task
                ? 'Save Changes'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
