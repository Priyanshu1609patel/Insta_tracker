import { useState, useEffect } from 'react';

// Free API for USD to INR exchange rate
const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

export function useCurrency() {
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR');
  const [exchangeRate, setExchangeRate] = useState(92.5); // fallback rate - updated Apr 2026
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchExchangeRate = async () => {
    setLoading(true);
    try {
      const response = await fetch(EXCHANGE_API);
      const data = await response.json();
      if (data.rates && data.rates.INR) {
        setExchangeRate(data.rates.INR);
        setLastUpdated(new Date().toISOString());
        localStorage.setItem('exchangeRate', data.rates.INR.toString());
        localStorage.setItem('exchangeRateUpdated', new Date().toISOString());
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using cached/fallback');
      // Try to use cached rate
      const cached = localStorage.getItem('exchangeRate');
      if (cached) setExchangeRate(parseFloat(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load cached rate on mount
    const cached = localStorage.getItem('exchangeRate');
    const cacheTime = localStorage.getItem('exchangeRateUpdated');
    
    if (cached) setExchangeRate(parseFloat(cached));
    if (cacheTime) setLastUpdated(cacheTime);

    // Check if cache is older than 1 hour
    const isStale = !cacheTime || (Date.now() - new Date(cacheTime).getTime()) > 60 * 60 * 1000;
    
    if (isStale) {
      fetchExchangeRate();
    }

    // Auto-refresh every hour
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const convertToUSD = (inrAmount) => {
    return inrAmount / exchangeRate;
  };

  const convertToINR = (usdAmount) => {
    return usdAmount * exchangeRate;
  };

  return {
    currency,
    changeCurrency,
    exchangeRate,
    lastUpdated,
    loading,
    convertToUSD,
    convertToINR,
    refreshRate: fetchExchangeRate,
  };
}