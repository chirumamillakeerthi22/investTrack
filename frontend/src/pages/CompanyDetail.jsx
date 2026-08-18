import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getStockHistory,
  getStockQuote,
} from '../services/marketData';

function CompanyDetail() {
  const { symbol } = useParams();

  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);

  const [quoteLoading, setQuoteLoading] =
    useState(true);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [quoteError, setQuoteError] =
    useState('');

  const [historyError, setHistoryError] =
    useState('');

  const displaySymbol = symbol
    ? decodeURIComponent(symbol).toUpperCase()
    : '';

  useEffect(() => {
    async function loadQuote() {
      if (!displaySymbol) {
        setQuoteError('Stock symbol is missing.');
        setQuoteLoading(false);
        return;
      }

      setQuoteLoading(true);
      setQuoteError('');

      try {
        const data =
          await getStockQuote(displaySymbol);

        setQuote(data);
      } catch (err) {
        console.error(
          'Stock quote failed:',
          err
        );

        setQuoteError(
          err.message ||
            'Unable to load stock quote.'
        );
      } finally {
        setQuoteLoading(false);
      }
    }

    loadQuote();
  }, [displaySymbol]);

  useEffect(() => {
    async function loadHistory() {
      if (!displaySymbol) {
        setHistoryError('Stock symbol is missing.');
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError('');

      try {
        const data =
          await getStockHistory(displaySymbol);

        setHistory(data);
      } catch (err) {
        console.error(
          'Stock history failed:',
          err
        );

        setHistoryError(
          err.message ||
            'Unable to load historical stock data.'
        );
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [displaySymbol]);

  const chartData = useMemo(() => {
    return history.map((item) => ({
      date: item.date,
      close: item.close,
    }));
  }, [history]);

  function formatDate(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        year: 'numeric',
      }
    );
  }

  function formatTooltipDate(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  return (
    <main>
      <p>
        <Link to="/dashboard">
          ← Back to Dashboard
        </Link>
      </p>

      <h1>{displaySymbol}</h1>

      {/* Current Quote */}

      <section>
        <h2>Current Market Data</h2>

        {quoteLoading && (
          <p>Loading current price...</p>
        )}

        {quoteError && (
          <p>Error: {quoteError}</p>
        )}

        {!quoteLoading &&
          !quoteError &&
          quote && (
            <>
              <p>
                Current Price: $
                {quote.currentPrice?.toFixed(2)}
              </p>

              <p>
                Change:{' '}
                {quote.change >= 0
                  ? '+'
                  : ''}
                {quote.change?.toFixed(2)}
              </p>

              <p>
                Change %:{' '}
                {quote.percentChange >= 0
                  ? '+'
                  : ''}
                {quote.percentChange?.toFixed(2)}
                %
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
            </>
          )}
      </section>

      {/* Historical Chart */}

      <section>
        <h2>5-Year Historical Price</h2>

        {historyLoading && (
          <p>
            Loading historical price chart...
          </p>
        )}

        {historyError && (
          <p>Error: {historyError}</p>
        )}

        {!historyLoading &&
          !historyError &&
          chartData.length > 0 && (
            <div
              style={{
                width: '100%',
                height: 400,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 10,
                    bottom: 20,
                  }}
                >
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    minTickGap={50}
                  />

                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(value) =>
                      `$${Number(value).toFixed(0)}`
                    }
                  />

                  <Tooltip
                    labelFormatter={
                      formatTooltipDate
                    }
                    formatter={(value) => [
                      `$${Number(value).toFixed(2)}`,
                      'Close',
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="close"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        {!historyLoading &&
          !historyError &&
          chartData.length === 0 && (
            <p>
              No historical data available.
            </p>
          )}
      </section>

      {/* Actions */}

      <section>
        <h2>Actions</h2>

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
    </main>
  );
}

export default CompanyDetail;