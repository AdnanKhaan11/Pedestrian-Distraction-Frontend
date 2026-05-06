export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

export const getStatusFromUsage = (usage) => {
  if (usage >= 80) return 'danger';
  if (usage >= 60) return 'warning';
  return 'active';
};

export const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return `${Math.floor(diffInMinutes / 1440)} days ago`;
};

export const generateDeviceId = () => {
  return Math.random().toString(36).substr(2, 9);
};