import { Plus, SearchX, LayoutGrid } from 'lucide-react';
import BoardCard from './BoardCard';
import './BoardList.css';

const BoardList = ({
  boards,
  isSearching,
  searchQuery,
  onRename,
  onDeleteClick,
  onCreateClick,
  onClearSearch,
}) => {
  if (boards.length === 0) {
    if (isSearching) {
      return (
        <div className="board-list-empty">
          <div className="board-list-empty-icon">
            <SearchX size={32} />
          </div>
          <h3>No boards match your search</h3>
          <p>No boards found matching &ldquo;{searchQuery}&rdquo;. Try another search term.</p>
          <button className="btn-secondary" onClick={onClearSearch}>
            Clear search
          </button>
        </div>
      );
    }

    return (
      <div className="board-list-empty">
        <div className="board-list-empty-icon">
          <LayoutGrid size={32} />
        </div>
        <h3>No boards yet</h3>
        <p>Create your first board to get started organizing projects and tasks.</p>
        <button className="btn-primary" onClick={onCreateClick}>
          <Plus size={16} />
          <span>Create Board</span>
        </button>
      </div>
    );
  }

  return (
    <div className="board-list">
      {boards.map((board) => (
        <BoardCard
          key={board._id}
          board={board}
          onRename={onRename}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
};

export default BoardList;
