import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, Kanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo-icon">
              <Kanban size={18} />
            </div>
            <span className="navbar-brand-name">TeamTasks</span>
          </Link>
        </div>

        <div className="navbar-actions">
          <button
            onClick={toggleTheme}
            className="btn-ghost btn-icon navbar-theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div className="navbar-user-profile">
              <div className="navbar-avatar" title={user.name}>
                {getInitials(user.name)}
              </div>
              <span className="navbar-user-name">{user.name}</span>
            </div>
          )}

          <button
            onClick={logout}
            className="btn-secondary btn-sm navbar-logout"
            title="Log out of account"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
