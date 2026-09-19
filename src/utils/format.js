export const formatCurrency = (n = 0) =>
  `₹${Number(n).toLocaleString('en-IN')}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

export const formatMinutes = (m = 0) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
};