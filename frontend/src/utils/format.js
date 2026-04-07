// mode: 'intl' | 'indian' | 'exact'

export function formatViews(num, mode = 'intl') {
  if (num === null || num === undefined || num === '') return '0';
  num = Number(num);
  if (isNaN(num)) return '0';

  if (mode === 'exact') return num.toLocaleString('en-IN');

  if (mode === 'indian') {
    if (num >= 1_00_00_000) return (num / 1_00_00_000).toFixed(2) + ' Cr';
    if (num >= 1_00_000)    return (num / 1_00_000).toFixed(2) + ' L';
    if (num >= 1_000)       return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString('en-IN');
  }

  // intl (default)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000)         return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString('en-IN');
}

export function formatCurrency(amount, mode = 'intl') {
  if (!amount) return '₹0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';

  if (mode === 'exact') {
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (mode === 'indian') {
    if (num >= 1_00_00_000) return '₹' + (num / 1_00_00_000).toFixed(2) + ' Cr';
    if (num >= 1_00_000)    return '₹' + (num / 1_00_000).toFixed(2) + ' L';
    if (num >= 1_000)       return '₹' + (num / 1_000).toFixed(1) + 'K';
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  // intl (default)
  if (num >= 1_000_000_000) return '₹' + (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000)     return '₹' + (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000)         return '₹' + (num / 1_000).toFixed(1) + 'K';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export function exactViews(num) {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN');
}

export function exactCurrency(amount) {
  if (!amount) return '₹0.00';
  return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}
