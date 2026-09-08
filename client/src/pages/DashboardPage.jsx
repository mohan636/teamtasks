import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Search, ArrowUpDown, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import BoardList from '../components/BoardList';
import ConfirmDialog from '../components/ConfirmDialog';
import axiosClient from '../api/axiosClient';
import './DashboardPage.css';

const DashboardPage = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'name' | 'tasks'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBoards = async () => {
    try {
      const { data } = await axiosClient.get('/boards');
      setBoards(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    setCreating(true);
    try {
      const { data } = await axiosClient.post('/boards', {
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || undefined,
      });
      setBoards((prev) => [data.data, ...prev]);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setShowCreateModal(false);
      toast.success('Board created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleRenameBoard = async (boardId, newTitle) => {
    try {
      const { data } = await axiosClient.put(`/boards/${boardId}`, { title: newTitle });
      setBoards((prev) =>
        prev.map((b) => (b._id === boardId ? { ...b, title: data.data.title } : b))
      );
      toast.success('Board updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update board');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!boardToDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/boards/${boardToDelete._id}`);
      setBoards((prev) => prev.filter((b) => b._id !== boardToDelete._id));
      toast.success('Board deleted');
      setBoardToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete board');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAndSortedBoards = useMemo(() => {
    let result = [...boards];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((b) => b.title.toLowerCase().includes(query));
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'tasks') {
      result.sort((a, b) => (b.taskCount || 0) - (a.taskCount || 0));
    } else {
      // 'recent'
      result.sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
    }

    return result;
  }, [boards, searchQuery, sortBy]);

  return (
    <>
      <Navbar currentWorkspace="Dashboard" />
      <main className="dashboard container">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h1>My Boards</h1>
            <p className="dashboard-subtitle">Manage your projects and tasks</p>
          </div>
          {!loading && boards.length > 0 && (
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              <span>New Board</span>
            </button>
          )}
        </div>

        {/* Search and Filter Toolbar */}
        {!loading && boards.length > 0 && (
          <div className="dashboard-toolbar">
            <div className="dashboard-search-wrapper">
              <Search size={15} className="dashboard-search-icon" />
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="dashboard-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="dashboard-sort-wrapper">
              <ArrowUpDown size={14} className="dashboard-sort-icon" />
              <select
                className="dashboard-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Recently Updated</option>
                <option value="name">Alphabetical</option>
                <option value="tasks">Most Tasks</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="board-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="board-card board-card-skeleton">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-progress" />
                <div className="skeleton skeleton-footer" />
              </div>
            ))}
          </div>
        ) : (
          <BoardList
            boards={filteredAndSortedBoards}
            isSearching={!!searchQuery.trim()}
            searchQuery={searchQuery}
            onRename={handleRenameBoard}
            onDeleteClick={(board) => setBoardToDelete(board)}
            onCreateClick={() => setShowCreateModal(true)}
            onClearSearch={() => setSearchQuery('')}
          />
        )}
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label htmlFor="board-title">Board Title</label>
                <input
                  id="board-title"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="e.g. Food, Q4 Roadmap, Website Redesign"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="board-description">Description (Optional)</label>
                <textarea
                  id="board-description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="e.g. Manage food delivery tasks and orders"
                  rows={2}
                  style={{ minHeight: '60px' }}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBoardTitle('');
                    setNewBoardDescription('');
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setBoardToDelete(null)}
      />
    </>
  );
};

export default DashboardPage;
