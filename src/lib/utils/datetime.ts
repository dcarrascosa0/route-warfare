/**
 * DateTime utilities.
 */

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return target.toLocaleDateString();
  }
}

export function formatDateTime(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleString();
}

export function formatDate(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleDateString();
}

export function formatTime(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleTimeString();
}

export function isToday(date: string | Date): boolean {
  const today = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  
  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  );
}

export function isYesterday(date: string | Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = typeof date === 'string' ? new Date(date) : date;
  
  return (
    yesterday.getFullYear() === target.getFullYear() &&
    yesterday.getMonth() === target.getMonth() &&
    yesterday.getDate() === target.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}