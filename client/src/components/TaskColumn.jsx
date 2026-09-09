import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import './TaskColumn.css';

const COLUMN_CONFIG = {
  todo: {
    label: 'To Do',
    colorClass: 'todo',
  },
  'in-progress': {
    label: 'In Progress',
    colorClass: 'in-progress',
  },
  done: {
    label: 'Done',
    colorClass: 'done',
  },
};

const TaskColumn = ({
  status,
  tasks,
  onEdit,
  onDeleteClick,
  onQuickAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const config = COLUMN_CONFIG[status] || {
    label: status,
    colorClass: 'default',
  };

  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`task-column task-column--${config.colorClass} ${isOver ? 'task-column--drag-over' : ''}`}
    >
      <div className="task-column-header">
        <div className="task-column-header-left">
          <span className={`task-column-dot ${config.colorClass}`} />
          <h3 className="task-column-title">{config.label}</h3>
          <span className="task-column-count">{tasks.length}</span>
        </div>
        {status === 'todo' && onQuickAddTask && (
          <button
            className="btn-ghost btn-icon task-column-add-btn"
            onClick={() => onQuickAddTask(status)}
            title={`Add task to ${config.label}`}
            aria-label={`Add task to ${config.label}`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div className="task-column-body">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="task-column-empty">
              <p>No tasks</p>
              {status === 'todo' && onQuickAddTask && (
                <button
                  className="task-column-empty-add"
                  onClick={() => onQuickAddTask(status)}
                >
                  <Plus size={14} />
                  <span>Add task</span>
                </button>
              )}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={onEdit}
                onDeleteClick={onDeleteClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default TaskColumn;
