import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useParams,
  useLocation,
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

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';


function CompanyDetail() {
  const { symbol } = useParams();
  const location = useLocation();
  const { user } = useAuth();

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

  const [isInWatchlist, setIsInWatchlist] =
    useState(false);

  const [isInWishlist, setIsInWishlist] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState('');

  const [actionError, setActionError] =
    useState('');


  const displaySymbol = symbol
    ? decodeURIComponent(symbol).toUpperCase()
    : '';


  // --------------------------------------------------
  // Load current stock quote
  // --------------------------------------------------

  useEffect(() => {
    async function loadQuote() {
      if (!displaySymbol) {
        setQuoteError(
          'Stock symbol is missing.'
        );

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


  // --------------------------------------------------
  // Load historical price data
  // --------------------------------------------------

  useEffect(() => {
    async function loadHistory() {
      if (!displaySymbol) {
        setHistoryError(
          'Stock symbol is missing.'
        );

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


  // --------------------------------------------------
  // Prepare chart data
  // --------------------------------------------------

  const chartData = useMemo(() => {
    return history.map((item) => ({
      date: item.date,
      close: item.close,
    }));
  }, [history]);


  // --------------------------------------------------
  // Check Watchlist / Wishlist status
  // --------------------------------------------------

  useEffect(() => {
    async function loadCompanyActions() {
      if (!user || !displaySymbol) {
        setIsInWatchlist(false);
        setIsInWishlist(false);

        return;
      }

      setActionError('');

      try {
        // --------------------------------------------
        // Find stock record
        // --------------------------------------------

        const {
          data: stock,
          error: stockError,
        } = await supabase
          .from('stocks')
          .select(
            'id, symbol, company_name'
          )
          .eq('symbol', displaySymbol)
          .maybeSingle();

        if (stockError) {
          console.error(
            'Stock lookup failed:',
            stockError
          );

          setActionError(
            'Unable to check company status.'
          );

          return;
        }

        if (!stock) {
          setIsInWatchlist(false);
          setIsInWishlist(false);

          return;
        }

        // --------------------------------------------
        // Check Watchlist
        // --------------------------------------------

        const {
          data: watchlistItem,
          error: watchlistError,
        } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('stock_id', stock.id)
          .maybeSingle();

        if (watchlistError) {
          console.error(
            'Watchlist status check failed:',
            watchlistError
          );
        }

        // --------------------------------------------
        // Check Wishlist
        // --------------------------------------------

        const {
          data: wishlistItem,
          error: wishlistError,
        } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('stock_id', stock.id)
          .maybeSingle();

        if (wishlistError) {
          console.error(
            'Wishlist status check failed:',
            wishlistError
          );
        }

        setIsInWatchlist(
          Boolean(watchlistItem)
        );

        setIsInWishlist(
          Boolean(wishlistItem)
        );
      } catch (err) {
        console.error(
          'Company action status failed:',
          err
        );

        setActionError(
          err.message ||
            'Unable to check company status.'
        );
      }
    }

    loadCompanyActions();
  }, [user, displaySymbol]);


  // --------------------------------------------------
  // Find stock record
  // --------------------------------------------------

    async function getStockRecord() {
        if (!displaySymbol) {
            throw new Error(
                'Stock symbol is missing.'
            );
        }

        const companyName =
            selectedCompany?.companyName ||
            displaySymbol;

        const exchange =
            selectedCompany?.exchange || '';

        const { data, error } =
            await supabase.functions.invoke(
                'ensure-stock',
                {
                    body: {
                        symbol: displaySymbol,
                        companyName,
                        exchange,
                    },
                }
            );

        if (error) {
            console.error(
                'Ensure stock function failed:',
                error
            );

            throw new Error(
                'Unable to prepare this company.'
            );
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        if (!data?.stock) {
            throw new Error(
                'Unable to prepare this company.'
            );
        }

        return data.stock;
    }


  // --------------------------------------------------
  // Add / Remove Watchlist
  // --------------------------------------------------

  async function handleWatchlist() {
    console.log(
      'Watchlist button clicked'
    );

    if (!user) {
      setActionError(
        'You must be signed in to manage your watchlist.'
      );

      return;
    }

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const stock =
        await getStockRecord();

      if (isInWatchlist) {
        const {
          error: deleteError,
        } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_id', stock.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsInWatchlist(false);

        setActionMessage(
          `${displaySymbol} removed from your watchlist.`
        );
      } else {
        const {
          error: insertError,
        } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            stock_id: stock.id,
          });

        if (insertError) {
          throw insertError;
        }

        setIsInWatchlist(true);

        setActionMessage(
          `${displaySymbol} added to your watchlist.`
        );
      }
    } catch (err) {
      console.error(
        'Watchlist action failed:',
        err
      );

      setActionError(
        err.message ||
          'Unable to update your watchlist.'
      );
    } finally {
      setActionLoading(false);
    }
  }


  // --------------------------------------------------
  // Add / Remove Wishlist
  // --------------------------------------------------

  async function handleWishlist() {
    console.log(
      'Wishlist button clicked'
    );

    if (!user) {
      setActionError(
        'You must be signed in to manage your wishlist.'
      );

      return;
    }

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const stock =
        await getStockRecord();

      if (isInWishlist) {
        const {
          error: deleteError,
        } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_id', stock.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsInWishlist(false);

        setActionMessage(
          `${displaySymbol} removed from your wishlist.`
        );
      } else {
        const {
          error: insertError,
        } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            stock_id: stock.id,
          });

        if (insertError) {
          throw insertError;
        }

        setIsInWishlist(true);

        setActionMessage(
          `${displaySymbol} added to your wishlist.`
        );
      }
    } catch (err) {
      console.error(
        'Wishlist action failed:',
        err
      );

      setActionError(
        err.message ||
          'Unable to update your wishlist.'
      );
    } finally {
      setActionLoading(false);
    }
  }


  // --------------------------------------------------
  // Date formatting
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <main className="page-section">

      {/* Back navigation */}

      <p>
        <Link to="/dashboard">
          ← Back to Dashboard
        </Link>
      </p>


      {/* Company */}

      <div className="page-header">
        <div>
          <h1>{displaySymbol}</h1>

          <p>
            Company market information
          </p>
        </div>
      </div>


      {/* Current Quote */}

      <section className="page-card company-market-card">
        <div className="company-section-header">
          <h2>Current Market Data</h2>
        </div>

        {quoteLoading && (
          <p className="page-status">
            Loading current price...
          </p>
        )}

        {quoteError && (
          <p className="page-error">
            Error: {quoteError}
          </p>
        )}

        {!quoteLoading &&
          !quoteError &&
          quote && (
            <div className="company-quote-grid">

              <div>
                <span className="company-quote-label">
                  Current Price
                </span>

                <strong className="company-quote-price">
                  $
                  {quote.currentPrice?.toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Change
                </span>

                <strong>
                  {quote.change >= 0
                    ? '+'
                    : ''}
                  {quote.change?.toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Change %
                </span>

                <strong>
                  {quote.percentChange >= 0
                    ? '+'
                    : ''}
                  {quote.percentChange?.toFixed(2)}
                  %
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Open
                </span>

                <strong>
                  $
                  {quote.open?.toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Previous Close
                </span>

                <strong>
                  $
                  {quote.previousClose?.toFixed(
                    2
                  )}
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Day High
                </span>

                <strong>
                  $
                  {quote.high?.toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="company-quote-label">
                  Day Low
                </span>

                <strong>
                  $
                  {quote.low?.toFixed(2)}
                </strong>
              </div>

            </div>
          )}
      </section>


      {/* Historical Chart */}

      <section className="page-card company-history-card">
        <div className="company-section-header">
          <h2>5-Year Historical Price</h2>

          {!historyLoading &&
            !historyError &&
            chartData.length > 0 && (
              <span className="company-history-count">
                {chartData.length.toLocaleString()}
                {' '}
                trading days
              </span>
            )}
        </div>

        {historyLoading && (
          <p className="page-status">
            Loading historical price chart...
          </p>
        )}

        {historyError && (
          <p className="page-error">
            Error: {historyError}
          </p>
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
                    domain={[
                      'auto',
                      'auto',
                    ]}
                    tickFormatter={(value) =>
                      `$${Number(value).toFixed(
                        0
                      )}`
                    }
                  />

                  <Tooltip
                    labelFormatter={
                      formatTooltipDate
                    }
                    formatter={(value) => [
                      `$${Number(value).toFixed(
                        2
                      )}`,
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
            <p className="page-status">
              No historical data available.
            </p>
          )}
      </section>


      {/* Actions */}

      <section className="page-card company-actions">

        <div className="company-section-header">
          <h2>Actions</h2>
        </div>

        <div className="company-action-buttons">

          <button
            type="button"
            onClick={handleWatchlist}
            disabled={actionLoading}
          >
            {isInWatchlist
              ? 'Remove from Watchlist'
              : 'Add to Watchlist'}
          </button>


          <button
            type="button"
            onClick={handleWishlist}
            disabled={actionLoading}
          >
            {isInWishlist
              ? 'Remove from Wishlist'
              : 'Add to Wishlist'}
          </button>


          <button
            type="button"
            disabled
          >
            Add to Portfolio
          </button>

        </div>


        {actionMessage && (
          <p className="company-action-success">
            {actionMessage}
          </p>
        )}


        {actionError && (
          <p className="company-action-error">
            {actionError}
          </p>
        )}

      </section>

    </main>
  );
}

export default CompanyDetail;