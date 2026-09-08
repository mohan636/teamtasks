import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Edit2, Trash2, Calendar, AlertCircle, GripVertical } from 'lucide-react';
import { formatShortDate, isTaskOverdue } from '../utils/dateUtils';
import './TaskCard.css';

const TaskCard = ({ task, onEdit, onDeleteClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isOverdue = isTaskOverdue(task.dueDate, task.status);
  const formattedDue = formatShortDate(task.dueDate);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isOverdue ? 'task-card--overdue' : ''} ${isDragging ? 'task-card--dragging' : ''}`}
      {...attributes}
    >
      <div className="task-card-header">
        <div className="task-card-drag-handle" {...listeners} title="Drag to move">
          <GripVertical size={14} />
        </div>
        <h4 className="task-card-title">{task.title}</h4>
        <div className="task-card-menu" ref={menuRef}>
          <button
            className="task-card-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Task options"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div className="task-card-dropdown">
              <button
                className="task-card-dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(task);
                }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                className="task-card-dropdown-item destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDeleteClick(task);
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      {formattedDue && (
        <div className="task-card-footer">
          <div className={`task-card-due-badge ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
            <span>{isOverdue ? `Overdue · ${formattedDue}` : `Due ${formattedDue}`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
