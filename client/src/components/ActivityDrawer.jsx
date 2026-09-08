import { useState, useEffect } from 'react';
import { X, Activity as ActivityIcon, PlusCircle, ArrowRightLeft, Edit3, Trash2, UserPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { timeAgo } from '../utils/dateUtils';
import axiosClient from '../api/axiosClient';
import './ActivityDrawer.css';

const formatActivityText = (item) => {
  const actor = item.userId?.name || 'Someone';
  const meta = item.metadata || {};

  switch (item.action) {
    case 'BOARD_CREATED':
      return {
        icon: <PlusCircle size={15} className="activity-icon create" />,
        text: (
          <span>
            <strong>{actor}</strong> created this board
          </span>
        ),
      };
    case 'BOARD_RENAMED':
      return {
        icon: <Edit3 size={15} className="activity-icon edit" />,
        text: (
          <span>
            <strong>{actor}</strong> renamed board to &ldquo;{meta.newTitle || 'Untitled'}&rdquo;
          </span>
        ),
      };
    case 'TASK_CREATED':
      return {
        icon: <PlusCircle size={15} className="activity-icon create" />,
        text: (
          <span>
            <strong>{actor}</strong> created &ldquo;{meta.taskTitle || item.taskId?.title || 'task'}&rdquo;
          </span>
        ),
      };
    case 'TASK_UPDATED':
      return {
        icon: <Edit3 size={15} className="activity-icon edit" />,
        text: (
          <span>
            <strong>{actor}</strong> updated &ldquo;{meta.taskTitle || item.taskId?.title || 'task'}&rdquo;
          </span>
        ),
      };
    case 'TASK_MOVED':
      const toLabel =
        meta.toStatus === 'todo'
          ? 'To Do'
          : meta.toStatus === 'in-progress'
          ? 'In Progress'
          : meta.toStatus === 'done'
          ? 'Done'
          : meta.toStatus;
      return {
        icon: <ArrowRightLeft size={15} className="activity-icon move" />,
        text: (
          <span>
            <strong>{actor}</strong> moved &ldquo;{meta.taskTitle || item.taskId?.title || 'task'}&rdquo; to{' '}
            <span className={`status-badge-inline ${meta.toStatus}`}>{toLabel}</span>
          </span>
        ),
      };
    case 'TASK_DELETED':
      return {
        icon: <Trash2 size={15} className="activity-icon delete" />,
        text: (
          <span>
            <strong>{actor}</strong> deleted &ldquo;{meta.taskTitle || 'task'}&rdquo;
          </span>
        ),
      };
    case 'MEMBER_INVITED':
      return {
        icon: <UserPlus size={15} className="activity-icon invite" />,
        text: (
          <span>
            <strong>{actor}</strong> invited <strong>{meta.invitedUserName || meta.invitedUserEmail}</strong>
          </span>
        ),
      };
    case 'MEMBER_REMOVED':
      return {
        icon: <Trash2 size={15} className="activity-icon delete" />,
        text: (
          <span>
            <strong>{actor}</strong> removed <strong>{meta.removedUserName || 'a member'}</strong>
          </span>
        ),
      };
    default:
      return {
        icon: <ActivityIcon size={15} className="activity-icon default" />,
        text: (
          <span>
            <strong>{actor}</strong> performed an action
          </span>
        ),
      };
  }
};

const ActivityDrawer = ({ isOpen, onClose, boardId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/boards/${boardId}/activity`);
      setActivities(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && boardId) {
      fetchActivity();
    }
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  return (
    <div className="activity-drawer-overlay" onClick={onClose}>
      <div className="activity-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="activity-drawer-header">
          <div className="activity-drawer-title">
            <ActivityIcon size={18} />
            <h2>Activity Log</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close activity log">
            <X size={18} />
          </button>
        </div>

        <div className="activity-drawer-content">
          {loading ? (
            <div className="loading">Loading activity history...</div>
          ) : activities.length === 0 ? (
            <div className="activity-empty">
              <Clock size={32} />
              <p>No recent activity on this board.</p>
            </div>
          ) : (
            <div className="activity-timeline">
              {activities.map((item) => {
                const { icon, text } = formatActivityText(item);
                return (
                  <div key={item._id} className="activity-timeline-item">
                    <div className="activity-icon-container">{icon}</div>
                    <div className="activity-content">
                      <div className="activity-text">{text}</div>
                      <div className="activity-time">{timeAgo(item.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDrawer;
