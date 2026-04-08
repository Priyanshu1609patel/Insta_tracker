// mode: 'intl' | 'indian' | 'exact'
// currency: 'INR' | 'USD'
// exchangeRate: current USD to INR rate

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

export function formatCurrency(amount, mode = 'intl', currency = 'INR', exchangeRate = 92.5) {
  if (!amount) return currency === 'USD' ? '$0' : '₹0';
  let num = parseFloat(amount);
  if (isNaN(num)) return currency === 'USD' ? '$0' : '₹0';

  // Convert to USD if needed
  if (currency === 'USD') {
    num = num / exchangeRate;
  }

  const symbol = currency === 'USD' ? '$' : '₹';
  const decimals = currency === 'USD' ? 2 : 2;

  if (mode === 'exact') {
    return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  if (mode === 'indian') {
    if (num >= 1_00_00_000) return symbol + (num / 1_00_00_000).toFixed(2) + ' Cr';
    if (num >= 1_00_000)    return symbol + (num / 1_00_000).toFixed(2) + ' L';
    if (num >= 1_000)       return symbol + (num / 1_000).toFixed(1) + 'K';
    return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: decimals });
  }

  // intl (default)
  if (num >= 1_000_000_000) return symbol + (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000)     return symbol + (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000)         return symbol + (num / 1_000).toFixed(1) + 'K';
  return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: decimals });
}

export function exactViews(num) {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN');
}

export function exactCurrency(amount, currency = 'INR', exchangeRate = 92.5) {
  if (!amount) return currency === 'USD' ? '$0.00' : '₹0.00';
  let num = parseFloat(amount);
  if (currency === 'USD') num = num / exchangeRate;
  const symbol = currency === 'USD' ? '$' : '₹';
  return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
