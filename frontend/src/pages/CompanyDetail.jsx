import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
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

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ensureStock } from '../services/stocks';

function CompanyDetail() {
  const { symbol } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const company = location.state?.company;
  const { user } = useAuth();

  const displaySymbol = symbol
    ? decodeURIComponent(symbol).toUpperCase()
    : '';

  function handleAddToHoldings() {
    navigate(
      `/holdings/add/${encodeURIComponent(displaySymbol)}`,
      {
        state: {
          company,
          quote,
        },
      }
    );
  }

  const companyName =
    company?.companyName ||
    company?.description ||
    displaySymbol;

  const companyExchange =
    company?.exchange || '';

  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);

  const [historyRange, setHistoryRange] =
    useState('1Y');

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

  const [showHoldingForm, setShowHoldingForm] =
    useState(false);

  const [holdingQuantity, setHoldingQuantity] =
    useState('');

  const [holdingPrice, setHoldingPrice] =
    useState('');

  const [holdingDate, setHoldingDate] =
    useState('');


  /*
   * --------------------------------------------------
   * Safe number helper
   * --------------------------------------------------
   */

  function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  /*
   * --------------------------------------------------
   * Load current stock quote
   * --------------------------------------------------
   */

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
      setQuote(null);

      try {
        const data =
          await getStockQuote(displaySymbol);

        /*
         * Accept the normalized response from
         * stock-quote and also tolerate provider-style
         * field names if they are returned.
         */

        const normalizedQuote = {
          currentPrice: toNumber(
            data?.currentPrice ?? data?.c
          ),

          change: toNumber(
            data?.change ?? data?.d
          ),

          percentChange: toNumber(
            data?.percentChange ?? data?.dp
          ),

          high: toNumber(
            data?.high ?? data?.h
          ),

          low: toNumber(
            data?.low ?? data?.l
          ),

          open: toNumber(
            data?.open ?? data?.o
          ),

          previousClose: toNumber(
            data?.previousClose ?? data?.pc
          ),

          timestamp:
            data?.timestamp ??
            data?.t ??
            null,
        };

        setQuote(normalizedQuote);

        if (
          normalizedQuote.currentPrice === null
        ) {
          setQuoteError(
            'Current market price is unavailable.'
          );
        }
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

  /*
   * --------------------------------------------------
   * Load historical price data
   * --------------------------------------------------
   */

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
          await getStockHistory(
            displaySymbol,
            historyRange
          );

        setHistory(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          'Stock history failed:',
          err
        );

        setHistoryError(
          err.message ||
            'Unable to load historical stock data.'
        );

        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [
    displaySymbol,
    historyRange,
  ]);

  /*
   * --------------------------------------------------
   * Prepare chart data
   * --------------------------------------------------
   */

  const chartData = useMemo(() => {
    if (!history.length) {
      return [];
    }

    return history
      .map((item) => ({
        date: item.date,
        close: toNumber(item.close),
      }))
      .filter(
        (item) =>
          item.date &&
          item.close !== null
      );
  }, [history]);

  /*
   * --------------------------------------------------
   * Check Watchlist / Wishlist state
   * --------------------------------------------------
   */

  useEffect(() => {
    async function loadUserActions() {
      if (
        !user ||
        !displaySymbol
      ) {
        return;
      }

      try {
        const stock = await ensureStock({
          displaySymbol,
          description:
            companyName ||
            displaySymbol,
          exchange:
            companyExchange,
        });

        if (!stock?.id) {
          return;
        }

        const [
          watchlistResult,
          wishlistResult,
        ] = await Promise.all([
          supabase
            .from('watchlist')
            .select('id')
            .eq('stock_id', stock.id)
            .maybeSingle(),

          supabase
            .from('wishlist')
            .select('id')
            .eq('stock_id', stock.id)
            .maybeSingle(),
        ]);

        if (
          !watchlistResult.error
        ) {
          setIsInWatchlist(
            Boolean(watchlistResult.data)
          );
        }

        if (
          !wishlistResult.error
        ) {
          setIsInWishlist(
            Boolean(wishlistResult.data)
          );
        }
      } catch (error) {
        console.error(
          'Unable to load company actions:',
          error
        );
      }
    }

    loadUserActions();
  }, [
    user,
    displaySymbol,
    companyName,
    companyExchange,
  ]);

  /*
   * --------------------------------------------------
   * Watchlist
   * --------------------------------------------------
   */

  async function handleWatchlist() {
    if (!user) {
      setActionError(
        'Please sign in to manage your watchlist.'
      );

      return;
    }

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const stock = await ensureStock({
        displaySymbol,
        description:
          companyName ||
          displaySymbol,
        exchange:
          companyExchange,
      });

      if (!stock?.id) {
        throw new Error(
          'Unable to identify this company.'
        );
      }

      if (isInWatchlist) {
        const { error } =
          await supabase
            .from('watchlist')
            .delete()
            .eq('stock_id', stock.id);

        if (error) {
          throw error;
        }

        setIsInWatchlist(false);

        setActionMessage(
          'Removed from your watchlist.'
        );
      } else {
        const { error } =
          await supabase
            .from('watchlist')
            .insert({
              stock_id: stock.id,
            });

        if (error) {
          throw error;
        }

        setIsInWatchlist(true);

        setActionMessage(
          'Added to your watchlist.'
        );
      }
    } catch (error) {
      console.error(
        'Watchlist action failed:',
        error
      );

      setActionError(
        error.message ||
          'Unable to update your watchlist.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Wishlist
   * --------------------------------------------------
   */

  async function handleWishlist() {
    if (!user) {
      setActionError(
        'Please sign in to manage your wishlist.'
      );

      return;
    }

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const stock = await ensureStock({
        displaySymbol,
        description:
          companyName ||
          displaySymbol,
        exchange:
          companyExchange,
      });

      if (!stock?.id) {
        throw new Error(
          'Unable to identify this company.'
        );
      }

      if (isInWishlist) {
        const { error } =
          await supabase
            .from('wishlist')
            .delete()
            .eq('stock_id', stock.id);

        if (error) {
          throw error;
        }

        setIsInWishlist(false);

        setActionMessage(
          'Removed from your wishlist.'
        );
      } else {
        const { error } =
          await supabase
            .from('wishlist')
            .insert({
              stock_id: stock.id,
            });

        if (error) {
          throw error;
        }

        setIsInWishlist(true);

        setActionMessage(
          'Added to your wishlist.'
        );
      }
    } catch (error) {
      console.error(
        'Wishlist action failed:',
        error
      );

      setActionError(
        error.message ||
          'Unable to update your wishlist.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Open holding form
   * --------------------------------------------------
   */

  function handleOpenHoldingForm() {
    navigate(
      `/holdings/add/${encodeURIComponent(displaySymbol)}`,
      {
        state: {
          company,
          quote,
        },
      }
    );
  }

  /*
   * --------------------------------------------------
   * Add holding
   * --------------------------------------------------
   */

  async function handleAddHolding(
    event
  ) {
    event.preventDefault();

    if (!user) {
      setActionError(
        'Please sign in to manage your holdings.'
      );

      return;
    }

    const quantity =
      Number(holdingQuantity);

    const purchasePrice =
      Number(holdingPrice);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setActionError(
        'Enter a valid number of shares.'
      );

      return;
    }

    if (
      !Number.isFinite(purchasePrice) ||
      purchasePrice <= 0
    ) {
      setActionError(
        'Enter a valid purchase price.'
      );

      return;
    }

    if (!holdingDate) {
      setActionError(
        'Select a purchase date.'
      );

      return;
    }

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const stock = await ensureStock({
        displaySymbol,
        description:
          companyName ||
          displaySymbol,
        exchange:
          companyExchange,
      });

      if (!stock?.id) {
        throw new Error(
          'Unable to identify this company.'
        );
      }

      const { error } =
        await supabase
          .from('portfolio_holdings')
          .insert({
            stock_id: stock.id,
            quantity,
            average_price:
              purchasePrice,
            created_at:
              new Date(
                `${holdingDate}T00:00:00`
              ).toISOString(),
          });

      if (error) {
        throw error;
      }

      setShowHoldingForm(false);
      setHoldingQuantity('');
      setHoldingPrice('');
      setHoldingDate('');

      setActionMessage(
        `${displaySymbol} was added to your holdings.`
      );

      navigate(
        '/holdings'
      );
    } catch (error) {
      console.error(
        'Add holding failed:',
        error
      );

      setActionError(
        error.message ||
          'Unable to add this holding.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Formatting helpers
   * --------------------------------------------------
   */

  function formatMoney(value) {
    const number = toNumber(value);

    if (number === null) {
      return '—';
    }

    return `$${number.toFixed(2)}`;
  }

  function formatChange(value) {
    const number = toNumber(value);

    if (number === null) {
      return '—';
    }

    return `${
      number >= 0
        ? '+'
        : ''
    }${number.toFixed(2)}`;
  }

  function formatPercent(value) {
    const number = toNumber(value);

    if (number === null) {
      return '—';
    }

    return `${
      number >= 0
        ? '+'
        : ''
    }${number.toFixed(2)}%`;
  }

  function getChangeClass(value) {
    const number = toNumber(value);

    if (number === null) {
      return '';
    }

    return number >= 0
      ? 'positive'
      : 'negative';
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
      }
    );
  }

  function formatTooltipDate(
    value
  ) {
    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour:
          historyRange === '1D'
            ? 'numeric'
            : undefined,
        minute:
          historyRange === '1D'
            ? '2-digit'
            : undefined,
      }
    );
  }

  const changeClass =
    getChangeClass(
      quote?.change
    );

  /*
   * --------------------------------------------------
   * Render
   * --------------------------------------------------
   */

  return (
    <main className="page-content">

      <div className="company-page-header">

        <div>
          <Link
            to="/dashboard"
            className="company-back-link"
          >
            ← Back
          </Link>

          <span className="company-section-eyebrow">
            Company Details
          </span>

          <h1>
            {companyName}
          </h1>

          <p>
            <strong>
              {displaySymbol}
            </strong>

            {companyExchange
              ? ` · ${companyExchange}`
              : ''}
          </p>
        </div>

      </div>

      {/* ------------------------------------------------ */}
      {/* Current Market Data                              */}
      {/* ------------------------------------------------ */}

      <section className="page-card company-market-card">

        <div className="company-section-header">
          <div>
            <span className="company-section-eyebrow">
              Market Snapshot
            </span>

            <h2>
              Current Market Data
            </h2>
          </div>

          {!quoteLoading &&
            quote?.currentPrice !== null &&
            quote?.currentPrice !== undefined && (
              <span className="company-live-badge">
                Live
              </span>
            )}
        </div>

        {quoteLoading && (
          <p className="page-status">
            Loading current market data...
          </p>
        )}

        {!quoteLoading &&
          quoteError && (
            <p className="page-error">
              {quoteError}
            </p>
          )}

        {!quoteLoading &&
          !quoteError &&
          quote && (
            <div className="company-market-grid">

              <article className="company-market-primary">

                <span>
                  Current Price
                </span>

                <strong>
                  {formatMoney(
                    quote.currentPrice
                  )}
                </strong>

                <div
                  className={`company-market-change ${changeClass}`}
                >
                  {formatChange(
                    quote.change
                  )}

                  {' '}

                  {formatPercent(
                    quote.percentChange
                  )}
                </div>

              </article>

              <article className="company-market-stat">
                <span>Open</span>

                <strong>
                  {formatMoney(
                    quote.open
                  )}
                </strong>
              </article>

              <article className="company-market-stat">
                <span>
                  Previous Close
                </span>

                <strong>
                  {formatMoney(
                    quote.previousClose
                  )}
                </strong>
              </article>

              <article className="company-market-stat">
                <span>
                  Day High
                </span>

                <strong>
                  {formatMoney(
                    quote.high
                  )}
                </strong>
              </article>

              <article className="company-market-stat">
                <span>
                  Day Low
                </span>

                <strong>
                  {formatMoney(
                    quote.low
                  )}
                </strong>
              </article>

            </div>
          )}

      </section>

      {/* ------------------------------------------------ */}
      {/* Price History                                    */}
      {/* ------------------------------------------------ */}

      <section className="page-card company-chart-card">

        <div className="company-section-header">

          <div>
            <span className="company-section-eyebrow">
              Price History
            </span>

            <h2>
              Historical Performance
            </h2>
          </div>

          <div className="company-chart-ranges">

            {[
              '1D',
              '1W',
              '1M',
              '3M',
              '6M',
              '1Y',
            ].map((range) => (
              <button
                key={range}
                type="button"
                className={
                  historyRange === range
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setHistoryRange(
                    range
                  )
                }
                disabled={
                  historyLoading
                }
              >
                {range}
              </button>
            ))}

          </div>

        </div>

        {historyLoading && (
          <p className="page-status">
            Loading historical price chart...
          </p>
        )}

        {historyError && (
          <p className="page-error">
            {historyError}
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
                    tickFormatter={
                      formatDate
                    }
                    minTickGap={50}
                  />

                  <YAxis
                    domain={[
                      'auto',
                      'auto',
                    ]}
                    tickFormatter={(value) =>
                      `$${Number(
                        value
                      ).toFixed(0)}`
                    }
                  />

                  <Tooltip
                    labelFormatter={
                      formatTooltipDate
                    }
                    formatter={(value) => [
                      formatMoney(
                        value
                      ),
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

      {/* ------------------------------------------------ */}
      {/* Actions                                          */}
      {/* ------------------------------------------------ */}

      <section className="page-card company-actions">

        <div className="company-section-header">
          <div>
            <span className="company-section-eyebrow">
              Portfolio
            </span>

            <h2>
              Manage Company
            </h2>
          </div>
        </div>

        <div className="company-action-buttons">

          <button
            type="button"
            onClick={
              handleWatchlist
            }
            disabled={
              actionLoading
            }
          >
            {isInWatchlist
              ? 'Remove from Watchlist'
              : 'Add to Watchlist'}
          </button>

          <button
            type="button"
            onClick={
              handleWishlist
            }
            disabled={
              actionLoading
            }
          >
            {isInWishlist
              ? 'Remove from Wishlist'
              : 'Add to Wishlist'}
          </button>

          <button
            type="button"
            onClick={handleAddToHoldings}
            disabled={actionLoading}
          >
            Add to My Holdings
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