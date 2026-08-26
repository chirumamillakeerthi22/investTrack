import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';


function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPortfolio() {
      if (!user) {
        setHoldings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const {
          data,
          error: holdingsError,
        } = await supabase
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
              company_name,
              exchange
            )
          `)
          .order('created_at', {
            ascending: false,
          });

        if (holdingsError) {
          throw holdingsError;
        }

        const portfolioHoldings = data ?? [];

        const holdingsWithQuotes =
          await Promise.all(
            portfolioHoldings.map(
              async (holding) => {
                const symbol =
                  holding.stocks?.symbol;

                if (!symbol) {
                  return {
                    ...holding,
                    quote: null,
                    quoteError: true,
                  };
                }

                try {
                  const quote =
                    await getStockQuote(symbol);

                  return {
                    ...holding,
                    quote,
                    quoteError: false,
                  };
                } catch (quoteError) {
                  console.error(
                    `Quote failed for ${symbol}:`,
                    quoteError
                  );

                  return {
                    ...holding,
                    quote: null,
                    quoteError: true,
                  };
                }
              }
            )
          );

        setHoldings(holdingsWithQuotes);
      } catch (loadError) {
        console.error(
          'Portfolio loading failed:',
          loadError
        );

        setError(
          loadError.message ||
            'Unable to load your portfolio.'
        );

        setHoldings([]);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [user]);



  /*
   * Portfolio calculations
   *
   * Only holdings with a valid current market
   * price are included in current value,
   * gain/loss and return calculations.
   *
   * This prevents a failed market-data request
   * from being displayed as a false loss.
   */
  const portfolio = holdings.reduce(
    (totals, holding) => {
      const quantity =
        Number(holding.quantity) || 0;

      const averagePrice =
        Number(holding.average_price) || 0;

      const invested =
        quantity * averagePrice;

      totals.invested += invested;

      if (
        holding.quote &&
        Number.isFinite(
          Number(holding.quote.currentPrice)
        )
      ) {
        const currentPrice =
          Number(
            holding.quote.currentPrice
          );

        const currentValue =
          quantity * currentPrice;

        const gainLoss =
          currentValue - invested;

        totals.currentValue += currentValue;
        totals.gainLoss += gainLoss;

        if (gainLoss > 0) {
          totals.profit += gainLoss;
        }

        if (gainLoss < 0) {
          totals.loss += Math.abs(gainLoss);
        }

        totals.quotedHoldings += 1;
      } else {
        totals.unquotedHoldings += 1;
      }

      return totals;
    },
    {
      invested: 0,
      currentValue: 0,
      gainLoss: 0,
      profit: 0,
      loss: 0,
      quotedHoldings: 0,
      unquotedHoldings: 0,
    }
  );

  const totalReturn =
    portfolio.invested > 0
      ? (portfolio.gainLoss /
          portfolio.invested) *
        100
      : 0;

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatQuantity(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return '0';
    }

    return number.toLocaleString('en-US', {
      maximumFractionDigits: 4,
    });
  }

  function getPerformanceClass(value) {
    if (value > 0) {
      return 'profit';
    }

    if (value < 0) {
      return 'loss';
    }

    return 'neutral';
  }

  function getSignedCurrency(value) {
    if (value > 0) {
      return `+$${formatCurrency(value)}`;
    }

    if (value < 0) {
      return `-$${formatCurrency(
        Math.abs(value)
      )}`;
    }

    return '$0.00';
  }

  function getSignedPercent(value) {
    if (value > 0) {
      return `+${value.toFixed(2)}%`;
    }

    if (value < 0) {
      return `${value.toFixed(2)}%`;
    }

    return '0.00%';
  }

  function handleHoldingClick(symbol) {
    if (!symbol) {
      return;
    }

    navigate(
      `/company/${encodeURIComponent(symbol)}`
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Portfolio Overview</h1>

          <p>
            Track your investments and portfolio
            performance in one place.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="dashboard-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          Loading your portfolio...
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}

          <section
            className="portfolio-summary-grid"
            aria-label="Portfolio summary"
          >
            <article className="portfolio-summary-card">
              <span>Total Invested</span>

              <strong>
                ${formatCurrency(
                  portfolio.invested
                )}
              </strong>

              <small>
                Amount invested across holdings
              </small>
            </article>

            <article className="portfolio-summary-card">
              <span>Current Portfolio Value</span>

              <strong>
                ${formatCurrency(
                  portfolio.currentValue
                )}
              </strong>

              <small>
                Based on available market prices
              </small>
            </article>

            <article className="portfolio-summary-card">
              <span>Total Gain</span>

              <strong
                className={getPerformanceClass(
                  portfolio.gainLoss
                )}
              >
                {getSignedCurrency(
                  portfolio.gainLoss
                )}
              </strong>

              <small
                className={getPerformanceClass(
                  portfolio.gainLoss
                )}
              >
                {getSignedPercent(
                  totalReturn
                )}
              </small>
            </article>

            <article className="portfolio-summary-card">
              <span>Total Profit</span>

              <strong className="profit">
                +$
                {formatCurrency(
                  portfolio.profit
                )}
              </strong>

              <small>
                Profitable positions
              </small>
            </article>

            <article className="portfolio-summary-card">
              <span>Total Loss</span>

              <strong className="loss">
                -$
                {formatCurrency(
                  portfolio.loss
                )}
              </strong>

              <small>
                Losing positions
              </small>
            </article>
          </section>

          {/* Market Data Notice */}

          {portfolio.unquotedHoldings > 0 && (
            <div className="dashboard-market-notice">
              Market data is currently unavailable
              for{' '}
              {portfolio.unquotedHoldings}{' '}
              {portfolio.unquotedHoldings === 1
                ? 'holding'
                : 'holdings'}
              . Those positions are excluded
              from current-value and
              gain/loss calculations until a
              market price is available.
            </div>
          )}

          {/* Current Holdings */}

          <section className="dashboard-holdings-card">
            <div className="dashboard-section-header">
              <div>
                <h2>Current Holdings</h2>

                <p>
                  Your current investment
                  positions.
                </p>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No holdings yet</h3>

                <p>
                  Add an investment to your
                  portfolio to see it here.
                </p>
              </div>
            ) : (
              <div className="holdings-table-wrapper">
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Current Value</th>
                      <th>Gain / Loss</th>
                    </tr>
                  </thead>

                  <tbody>
                    {holdings.map(
                      (holding) => {
                        const quantity =
                          Number(
                            holding.quantity
                          ) || 0;

                        const averagePrice =
                          Number(
                            holding.average_price
                          ) || 0;

                        const invested =
                          quantity *
                          averagePrice;

                        const hasQuote =
                          holding.quote &&
                          Number.isFinite(
                            Number(
                              holding.quote
                                .currentPrice
                            )
                          );

                        const currentPrice =
                          hasQuote
                            ? Number(
                                holding.quote
                                  .currentPrice
                              )
                            : null;

                        const currentValue =
                          hasQuote
                            ? quantity *
                              currentPrice
                            : null;

                        const gainLoss =
                          hasQuote
                            ? currentValue -
                              invested
                            : null;

                        const returnPercent =
                          hasQuote &&
                          invested > 0
                            ? (gainLoss /
                                invested) *
                              100
                            : null;

                        const symbol =
                          holding.stocks
                            ?.symbol;

                        return (
                          <tr
                            key={holding.id}
                            className={
                              symbol
                                ? 'holding-row'
                                : ''
                            }
                            onClick={() =>
                              handleHoldingClick(
                                symbol
                              )
                            }
                            tabIndex={
                              symbol
                                ? 0
                                : undefined
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                symbol &&
                                (event.key ===
                                  'Enter' ||
                                  event.key ===
                                    ' ')
                              ) {
                                event.preventDefault();

                                handleHoldingClick(
                                  symbol
                                );
                              }
                            }}
                          >
                            <td>
                              <div className="holding-company">
                                <strong>
                                  {holding
                                    .stocks
                                    ?.company_name ||
                                    'Unknown company'}
                                </strong>

                                <span>
                                  {holding
                                    .stocks
                                    ?.exchange ||
                                    ''}
                                </span>
                              </div>
                            </td>

                            <td>
                              <strong>
                                {symbol || '—'}
                              </strong>
                            </td>

                            <td>
                              {formatQuantity(
                                quantity
                              )}
                            </td>

                            <td>
                              {hasQuote
                                ? `$${formatCurrency(
                                    currentValue
                                  )}`
                                : 'Unavailable'}
                            </td>

                            <td>
                              {hasQuote ? (
                                <div
                                  className={getPerformanceClass(
                                    gainLoss
                                  )}
                                >
                                  <strong>
                                    {getSignedCurrency(
                                      gainLoss
                                    )}
                                  </strong>

                                  <small>
                                    {' '}
                                    (
                                    {getSignedPercent(
                                      returnPercent
                                    )}
                                    )
                                  </small>
                                </div>
                              ) : (
                                <span className="neutral">
                                  Market data
                                  unavailable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;