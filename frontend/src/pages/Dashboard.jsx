import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';



function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');
  const [marketQuotes, setMarketQuotes] =
    useState([]);
  const [marketLoading, setMarketLoading] =
    useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        return;
      }

      setError('');


      // --------------------------------------------------
      // Load stocks
      // --------------------------------------------------

      const { data: stockData, error: stockError } =
        await supabase
          .from('stocks')
          .select('id, symbol, company_name, exchange')
          .order('symbol')
          .limit(10);

      if (stockError) {
        console.error('Stock query failed:', stockError);
        setError(stockError.message);
        return;
      }

      setStocks(stockData ?? []);

      // --------------------------------------------------
      // Load portfolio holdings
      // --------------------------------------------------

      const { data: holdingData, error: holdingError } =
        await supabase
          .from('portfolio_holdings')
          .select(`
            id,
            stock_id,
            quantity,
            average_price,
            created_at,
            updated_at,
            stocks (
              symbol,
              company_name
            )
          `)
          .order('created_at', { ascending: false });

      if (holdingError) {
        console.error(
          'Portfolio query failed:',
          holdingError
        );
        setError(holdingError.message);
        return;
      }

      setHoldings(holdingData ?? []);

      // --------------------------------------------------
      // Load watchlist
      // --------------------------------------------------

      const { data: watchlistData, error: watchlistError } =
        await supabase
          .from('watchlist')
          .select(`
            id,
            stock_id,
            created_at,
            stocks (
              symbol,
              company_name
            )
          `)
          .order('created_at', { ascending: false });

      if (watchlistError) {
        console.error(
          'Watchlist query failed:',
          watchlistError
        );
        setError(watchlistError.message);
        return;
      }

      setWatchlist(watchlistData ?? []);

      // --------------------------------------------------
      // Load wishlist
      // --------------------------------------------------

      const { data: wishlistData, error: wishlistError } =
        await supabase
          .from('wishlist')
          .select(`
            id,
            stock_id,
            created_at,
            stocks (
              symbol,
              company_name
            )
          `)
          .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error(
          'Wishlist query failed:',
          wishlistError
        );
        setError(wishlistError.message);
        return;
      }

      setWishlist(wishlistData ?? []);

      // --------------------------------------------------
      // Load feedback
      // --------------------------------------------------

      const { data: feedbackData, error: feedbackError } =
        await supabase
          .from('feedback')
          .select(`
            id,
            category,
            rating,
            message,
            created_at
          `)
          .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error(
          'Feedback query failed:',
          feedbackError
        );
        setError(feedbackError.message);
        return;
      }

      setFeedback(feedbackData ?? []);
    }

    loadDashboardData();
  }, [user]);




    useEffect(() => {
        async function loadMarketOverview() {
            if (!user) {
                return;
            }

            setMarketLoading(true);

            try {
                const { data: stockData, error: stockError } =
                    await supabase
                        .from('stocks')
                        .select(
                            'id, symbol, company_name, exchange'
                        )
                        .order('symbol')
                        .limit(5);

                if (stockError) {
                    console.error(
                        'Market overview stocks query failed:',
                        stockError
                    );

                    setError(stockError.message);
                    return;
                }

                const stocksForOverview =
                    stockData ?? [];

                if (stocksForOverview.length === 0) {
                    setMarketQuotes([]);
                    return;
                }

                const quoteResults =
                    await Promise.all(
                        stocksForOverview.map(
                            async (stock) => {
                                try {
                                    const quote =
                                        await getStockQuote(
                                            stock.symbol
                                        );

                                    return {
                                        ...stock,
                                        quote,
                                    };
                                } catch (quoteError) {
                                    console.error(
                                        `Quote failed for ${stock.symbol}:`,
                                        quoteError
                                    );

                                    return {
                                        ...stock,
                                        quote: null,
                                    };
                                }
                            }
                        )
                    );

                setMarketQuotes(quoteResults);
            } catch (loadError) {
                console.error(
                    'Market overview failed:',
                    loadError
                );

                setError(
                    loadError.message ||
                    'Unable to load market overview.'
                );
            } finally {
                setMarketLoading(false);
            }
        }

        loadMarketOverview();
    }, [user]);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
      <main className="dashboard">
          <div className="dashboard-header">
              <h1>Dashboard</h1>

              <p>
                  Welcome back. Here's an overview of your
                  investment workspace.
              </p>
          </div>

          <div className="dashboard-summary-grid">
              <article className="dashboard-summary-card">
                  <div className="dashboard-summary-label">
                      My Holdings
                  </div>

                  <div className="dashboard-summary-value">
                      {holdings.length}
                  </div>

                  <div className="dashboard-summary-description">
                      Companies currently in your portfolio
                  </div>
              </article>

              <article className="dashboard-summary-card">
                  <div className="dashboard-summary-label">
                      Watchlist
                  </div>

                  <div className="dashboard-summary-value">
                      {watchlist.length}
                  </div>

                  <div className="dashboard-summary-description">
                      Companies you're monitoring
                  </div>
              </article>

              <article className="dashboard-summary-card">
                  <div className="dashboard-summary-label">
                      Wishlist
                  </div>

                  <div className="dashboard-summary-value">
                      {wishlist.length}
                  </div>

                  <div className="dashboard-summary-description">
                      Companies you're considering
                  </div>
              </article>
          </div>


          <div className="dashboard-preview-grid">

              {/* Recent Holdings */}

              <section className="dashboard-preview-card">
                  <div className="dashboard-preview-header">
                      <h2>Recent Holdings</h2>

                      <button
                          type="button"
                          className="dashboard-preview-link"
                          onClick={() => {
                              window.location.href = '/holdings';
                          }}
                      >
                          View all →
                      </button>
                  </div>

                  {holdings.length === 0 ? (
                      <div className="dashboard-preview-empty">
                          No holdings yet.
                      </div>
                  ) : (
                      <ul className="dashboard-preview-list">
                          {holdings
                              .slice(0, 5)
                              .map((holding) => (
                                  <li
                                      key={holding.id}
                                      className="dashboard-preview-item"
                                  >
                                      <div className="dashboard-preview-company">
                                          <span className="dashboard-preview-symbol">
                                              {holding.stocks?.symbol ||
                                                  'Unknown'}
                                          </span>

                                          <span className="dashboard-preview-name">
                                              {holding.stocks?.company_name ||
                                                  'Unknown company'}
                                          </span>
                                      </div>

                                      <span className="dashboard-preview-detail">
                                          {holding.quantity} shares
                                      </span>
                                  </li>
                              ))}
                      </ul>
                  )}
              </section>

              {/* Watchlist */}

              <section className="dashboard-preview-card">
                  <div className="dashboard-preview-header">
                      <h2>My Watchlist</h2>

                      <button
                          type="button"
                          className="dashboard-preview-link"
                          onClick={() => {
                              window.location.href = '/watchlist';
                          }}
                      >
                          View all →
                      </button>
                  </div>

                  {watchlist.length === 0 ? (
                      <div className="dashboard-preview-empty">
                          Your watchlist is empty.
                      </div>
                  ) : (
                      <ul className="dashboard-preview-list">
                          {watchlist
                              .slice(0, 5)
                              .map((item) => (
                                  <li
                                      key={item.id}
                                      className="dashboard-preview-item"
                                  >
                                      <div className="dashboard-preview-company">
                                          <span className="dashboard-preview-symbol">
                                              {item.stocks?.symbol ||
                                                  'Unknown'}
                                          </span>

                                          <span className="dashboard-preview-name">
                                              {item.stocks?.company_name ||
                                                  'Unknown company'}
                                          </span>
                                      </div>
                                  </li>
                              ))}
                      </ul>
                  )}
              </section>

          </div>



          <section className="dashboard-market-card">
              <div className="dashboard-preview-header">
                  <h2>Market Overview</h2>
              </div>

              {marketLoading ? (
                  <div className="dashboard-market-status">
                      Loading market data...
                  </div>
              ) : marketQuotes.length === 0 ? (
                  <div className="dashboard-market-status">
                      No market data available.
                  </div>
              ) : (
                  <div className="dashboard-market-list">
                      {marketQuotes.map((stock) => {
                          const quote = stock.quote;

                          return (
                              <div
                                  key={stock.id}
                                  className="dashboard-market-row"
                              >
                                  <div className="dashboard-market-company">
                                      <strong>
                                          {stock.symbol}
                                      </strong>

                                      <span>
                                          {stock.company_name}
                                      </span>
                                  </div>

                                  <div className="dashboard-market-exchange">
                                      {stock.exchange || '—'}
                                  </div>

                                  <div className="dashboard-market-price">
                                      {quote
                                          ? `$${quote.currentPrice.toFixed(2)}`
                                          : '—'}
                                  </div>

                                  <div
                                      className={`dashboard-market-change ${quote &&
                                              quote.percentChange >= 0
                                              ? 'positive'
                                              : 'negative'
                                          }`}
                                  >
                                      {quote
                                          ? `${quote.percentChange >= 0
                                              ? '+'
                                              : ''
                                          }${quote.percentChange.toFixed(
                                              2
                                          )}%`
                                          : '—'}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </section>



      {/* ------------------------------------------------ */}
      {/* Stocks                                           */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Stocks</h2>

        {stocks.length === 0 ? (
          <p>No stocks available.</p>
        ) : (
          <ul>
            {stocks.map((stock) => (
              <li key={stock.id}>
                {stock.symbol} — {stock.company_name}
                {stock.exchange
                  ? ` (${stock.exchange})`
                  : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Portfolio Holdings                               */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Portfolio Holdings</h2>

        {holdings.length === 0 ? (
          <p>No portfolio holdings yet.</p>
        ) : (
          <ul>
            {holdings.map((holding) => (
              <li key={holding.id}>
                {holding.stocks?.symbol} —{' '}
                {holding.quantity} shares @ $
                {holding.average_price}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Watchlist                                        */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Watchlist</h2>

        {watchlist.length === 0 ? (
          <p>Watchlist is empty.</p>
        ) : (
          <ul>
            {watchlist.map((item) => (
              <li key={item.id}>
                {item.stocks?.symbol} —{' '}
                {item.stocks?.company_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Wishlist                                         */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Wishlist</h2>

        {wishlist.length === 0 ? (
          <p>Wishlist is empty.</p>
        ) : (
          <ul>
            {wishlist.map((item) => (
              <li key={item.id}>
                {item.stocks?.symbol} —{' '}
                {item.stocks?.company_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Feedback                                         */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Feedback</h2>

        {feedback.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          <ul>
            {feedback.map((item) => (
              <li key={item.id}>
                <strong>{item.category}</strong>

                {item.rating !== null &&
                  ` — Rating: ${item.rating}`}

                <br />

                {item.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Errors                                           */}
      {/* ------------------------------------------------ */}

      {error && <p>Error: {error}</p>}

      {/* ------------------------------------------------ */}
      {/* Logout                                           */}
      {/* ------------------------------------------------ */}

      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default Dashboard;
