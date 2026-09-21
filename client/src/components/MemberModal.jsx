import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, UserPlus, Shield, User, Trash2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import './MemberModal.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const MemberModal = ({ isOpen, onClose, boardId, isOwner, onMemberUpdated }) => {
  const [membersData, setMembersData] = useState({ owner: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/boards/${boardId}/members`);
      setMembersData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load board members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && boardId) {
      fetchMembers();
      setMemberEmail('');
    }
  }, [isOpen, boardId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAdding(true);
    try {
      const { data } = await axiosClient.post(`/boards/${boardId}/members`, {
        email: memberEmail.trim(),
      });
      setMembersData(data.data);
      setMemberEmail('');
      toast.success('Member added successfully');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingId(userId);
    try {
      const { data } = await axiosClient.delete(`/boards/${boardId}/members/${userId}`);
      setMembersData(data.data);
      toast.success('Member removed');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-modal-header">
          <h2>Board Members</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Members List */}
        <div className="member-modal-body">
          {loading ? (
            <div className="loading">Loading members...</div>
          ) : (
            <div className="member-list">
              {/* Owner */}
              {membersData.owner && (
                <div className="member-item">
                  <div className="member-avatar owner">
                    {getInitials(membersData.owner.name)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{membersData.owner.name}</div>
                    <div className="member-email">{membersData.owner.email}</div>
                  </div>
                  <div className="member-role-badge owner">
                    <Shield size={12} />
                    <span>Owner</span>
                  </div>
                </div>
              )}

              {/* Members */}
              {membersData.members &&
                membersData.members.map((m) => {
                  const u = m.user || {};
                  return (
                    <div key={u._id} className="member-item">
                      <div className="member-avatar">
                        {getInitials(u.name)}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{u.name}</div>
                        <div className="member-email">{u.email}</div>
                      </div>
                      <div className="member-role-badge">
                        <User size={12} />
                        <span>Member</span>
                      </div>
                      {isOwner && (
                        <button
                          className="btn-ghost btn-icon member-remove-btn"
                          title="Remove member"
                          onClick={() => handleRemoveMember(u._id)}
                          disabled={removingId === u._id}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Add Member Section (Owner only) */}
          {isOwner && (
            <div className="member-invite-section">
              <h3>Add Member</h3>
              <p className="member-invite-hint">
                Add existing TeamTasks users by email to collaborate on this board.
              </p>
              <form onSubmit={handleAddMember} className="member-invite-form">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
                <button type="submit" className="btn-primary" disabled={adding}>
                  <UserPlus size={15} />
                  <span>{adding ? 'Adding...' : 'Add Member'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberModal;
