// Date formatting and overdue calculations

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  // If it's in YYYY-MM-DD format (like from input[type="date"])
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // If it's an ISO string e.g. 2026-09-08T00:00:00.000Z
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = parseDateString(dateStr);
  if (!date) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  const date = parseDateString(dateStr);
  if (!date) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const isTaskOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  const due = parseDateString(dueDate);
  if (!due) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  
  return dueDay < today;
};

export const isDueToday = (dueDate) => {
  if (!dueDate) return false;
  const due = parseDateString(dueDate);
  if (!due) return false;
  
  const today = new Date();
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
};

export const isDueThisWeek = (dueDate) => {
  if (!dueDate) return false;
  const due = parseDateString(dueDate);
  if (!due) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  
  return due >= today && due <= endOfWeek;
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return formatDate(dateStr);
};
