import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  loading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={!loading ? onClose : undefined}>
      <div
        className="confirm-dialog-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon-wrapper ${isDestructive ? 'destructive' : 'primary'}`}>
            <AlertTriangle className="confirm-dialog-icon" size={20} />
          </div>
          <div className="confirm-dialog-header-text">
            <h3 id="confirm-dialog-title">{title}</h3>
            <p className="confirm-dialog-description">{description}</p>
          </div>
          {!loading && (
            <button
              className="confirm-dialog-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
