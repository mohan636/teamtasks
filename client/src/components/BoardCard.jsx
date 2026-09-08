import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { timeAgo } from '../utils/dateUtils';
import './BoardCard.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const BoardCard = ({ board, onRename, onDeleteClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const totalTasks = board.taskCount || 0;
  const completedTasks = board.completedCount || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const allMembers = [
    board.owner ? { ...board.owner, isOwner: true } : null,
    ...(board.members || []).map((m) => ({ ...(m.user || {}), isOwner: false })),
  ].filter(Boolean);

  useEffect(() => {
    setTitle(board.title);
  }, [board.title]);

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

  const handleSave = () => {
    if (title.trim() && title.trim() !== board.title) {
      onRename(board._id, title.trim());
    } else {
      setTitle(board.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTitle(board.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="board-card">
      <div className="board-card-top">
        <div className="board-card-title-container">
          {isEditing ? (
            <input
              className="board-card-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <Link to={`/boards/${board._id}`} className="board-card-title-link">
              <h3 className="board-card-title">{board.title}</h3>
            </Link>
          )}
        </div>

        <div className="board-card-menu-container" ref={menuRef}>
          <button
            className="board-card-menu-btn"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Board options"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="board-card-dropdown">
              <Link
                to={`/boards/${board._id}`}
                className="board-card-dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                <ArrowRight size={14} />
                <span>Open Board</span>
              </Link>
              <button
                className="board-card-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
              >
                <Edit2 size={14} />
                <span>Rename</span>
              </button>
              <button
                className="board-card-dropdown-item destructive"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteClick(board);
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {board.description && (
        <p className="board-card-description">{board.description}</p>
      )}

      <div className="board-card-stats-row">
        <div className="board-card-stats">
          <span className="board-card-task-count">
            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
          </span>
          {totalTasks > 0 && (
            <span className="board-card-completed-count">
              <CheckCircle2 size={12} />
              {completedTasks} completed
            </span>
          )}
        </div>

        {allMembers.length > 0 && (
          <div className="board-card-member-avatars">
            {allMembers.slice(0, 2).map((m, idx) => (
              <div
                key={m._id || idx}
                className={`board-card-avatar ${m.isOwner ? 'owner' : ''}`}
                title={`${m.name} (${m.isOwner ? 'Owner' : 'Member'})`}
              >
                {getInitials(m.name)}
              </div>
            ))}
            {allMembers.length > 2 && (
              <div className="board-card-avatar more">
                +{allMembers.length - 2}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="board-card-progress-wrapper">
        <div className="board-card-progress-bar">
          <div
            className="board-card-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="board-card-progress-text">{progressPercent}%</span>
      </div>

      <div className="board-card-footer">
        <div className="board-card-updated">
          <Clock size={12} />
          <span>Updated {timeAgo(board.updatedAt || board.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
