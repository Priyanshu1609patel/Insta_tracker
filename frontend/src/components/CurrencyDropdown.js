import React from 'react';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: '🇮🇳 INR', desc: 'Indian Rupee' },
  { value: 'USD', label: '🇺🇸 USD', desc: 'US Dollar' },
];

function CurrencyDropdown({ currency, onChange, exchangeRate, loading, lastUpdated }) {
  const current = CURRENCY_OPTIONS.find(o => o.value === currency);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currency:</span>
      <select
        value={currency}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          borderRadius: '7px', padding: '5px 10px', fontSize: '12px',
          color: 'var(--text)', cursor: 'pointer', outline: 'none',
        }}
      >
        {CURRENCY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      
      {/* Exchange rate info */}
      {currency === 'USD' && (
        <div style={{ 
          fontSize: '10px', 
          color: 'var(--text-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '2px 6px',
          background: 'var(--bg-card2)',
          borderRadius: '4px',
          border: '1px solid var(--border)'
        }}>
          {loading ? (
            <>
              <span className="spinner" style={{ width: 8, height: 8 }} />
              Updating...
            </>
          ) : (
            <>
              1 USD = ₹{exchangeRate.toFixed(2)}
              {lastUpdated && (
                <span title={`Last updated: ${new Date(lastUpdated).toLocaleString()}`}>
                  • {getTimeAgo(lastUpdated)}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default CurrencyDropdown;