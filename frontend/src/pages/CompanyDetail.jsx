import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getStockQuote } from '../services/marketData';

function CompanyDetail() {
  const { symbol } = useParams();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuote() {
      if (!symbol) {
        setError('Stock symbol is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setQuote(null);

      try {
        const data = await getStockQuote(
          decodeURIComponent(symbol)
        );

        setQuote(data);
      } catch (err) {
        console.error('Stock quote failed:', err);

        setError(
          err.message || 'Unable to load stock quote.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuote();
  }, [symbol]);

  const displaySymbol = symbol
    ? decodeURIComponent(symbol).toUpperCase()
    : '';

  return (
    <main>
      <p>
        <Link to="/dashboard">
          ← Back to Dashboard
        </Link>
      </p>

      <h1>{displaySymbol}</h1>

      {loading && <p>Loading market data...</p>}

      {error && <p>Error: {error}</p>}

      {!loading && !error && quote && (
        <section>
          <h2>{displaySymbol}</h2>

          <p>
            Current Price: $
            {quote.currentPrice?.toFixed(2)}
          </p>

          <p>
            Change:{' '}
            {quote.change >= 0 ? '+' : ''}
            {quote.change?.toFixed(2)}
          </p>

          <p>
            Change %:{' '}
            {quote.percentChange >= 0 ? '+' : ''}
            {quote.percentChange?.toFixed(2)}%
          </p>

          <hr />

          <p>
            Open: $
            {quote.open?.toFixed(2)}
          </p>

          <p>
            Previous Close: $
            {quote.previousClose?.toFixed(2)}
          </p>

          <p>
            Day High: $
            {quote.high?.toFixed(2)}
          </p>

          <p>
            Day Low: $
            {quote.low?.toFixed(2)}
          </p>

          <button type="button">
            Add to Watchlist
          </button>

          <button type="button">
            Add to Wishlist
          </button>

          <button type="button">
            Add to Portfolio
          </button>
        </section>
      )}
    </main>
  );
}

export default CompanyDetail;