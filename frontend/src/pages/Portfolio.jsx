import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';

function Portfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [holdings, setHoldings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [prices, setPrices] =
    useState({});

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
        const { data, error: holdingsError } =
          await supabase
            .from('portfolio_holdings')
            .select(`
              id,
              stock_id,
              quantity,
              average_price,
              created_at,
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

        const portfolio =
          data ?? [];

        setHoldings(portfolio);

        const uniqueSymbols = [
          ...new Set(
            portfolio
              .map(
                (item) =>
                  item.stocks?.symbol
              )
              .filter(Boolean)
          ),
        ];

        const quoteResults =
          await Promise.all(
            uniqueSymbols.map(
              async (stockSymbol) => {
                try {
                  const quote =
                    await getStockQuote(
                      stockSymbol
                    );

                  return [
                    stockSymbol,
                    quote,
                  ];
                } catch (quoteError) {
                  console.error(
                    `Quote failed for ${stockSymbol}:`,
                    quoteError
                  );

                  return [
                    stockSymbol,
                    null,
                  ];
                }
              }
            )
          );

        setPrices(
          Object.fromEntries(
            quoteResults
          )
        );
      } catch (err) {
        console.error(
          'Portfolio query failed:',
          err
        );

        setError(
          err.message ||
            'Unable to load portfolio.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [user]);

  const portfolioRows = useMemo(() => {
    return holdings.map((holding) => {
      const symbol =
        holding.stocks?.symbol || '';

      const quantity =
        Number(holding.quantity) || 0;

      const purchasePrice =
        Number(
          holding.average_price
        ) || 0;

      const quote =
        prices[symbol];

      const currentPrice =
        Number(
          quote?.currentPrice
        );

      const invested =
        quantity *
        purchasePrice;

      const currentValue =
        Number.isFinite(currentPrice)
          ? quantity *
            currentPrice
          : null;

      const profitLoss =
        currentValue !== null
          ? currentValue -
            invested
          : null;

      const returnPercent =
        currentValue !== null &&
        invested > 0
          ? (profitLoss /
              invested) *
            100
          : null;

      return {
        ...holding,
        symbol,
        quantity,
        purchasePrice,
        currentPrice,
        invested,
        currentValue,
        profitLoss,
        returnPercent,
      };
    });
  }, [
    holdings,
    prices,
  ]);

  const summary = useMemo(() => {
    const totalInvested =
      portfolioRows.reduce(
        (total, item) =>
          total + item.invested,
        0
      );

    const totalCurrentValue =
      portfolioRows.reduce(
        (total, item) =>
          total +
          (item.currentValue ?? 0),
        0
      );

    const totalProfitLoss =
      totalCurrentValue -
      totalInvested;

    const totalReturn =
      totalInvested > 0
        ? (totalProfitLoss /
            totalInvested) *
          100
        : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalReturn,
    };
  }, [portfolioRows]);

  function formatMoney(value) {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(
        Number(value)
      )
    ) {
      return '—';
    }

    return `$${Number(value).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatPercent(value) {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(
        Number(value)
      )
    ) {
      return '—';
    }

    const number = Number(value);

    return `${
      number >= 0 ? '+' : ''
    }${number.toFixed(2)}%`;
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '—';
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  function navigateToCompany(symbol) {
    if (!symbol) {
      return;
    }

    const holding = holdings.find(
      (item) =>
        item.stocks?.symbol === symbol
    );

    navigate(
      `/company/${encodeURIComponent(symbol)}`,
      {
        state: {
          company: {
            symbol,
            displaySymbol: symbol,
            companyName:
              holding?.stocks?.company_name ||
              symbol,
            exchange:
              holding?.stocks?.exchange ||
              '',
          },
        },
      }
    );
  }

  return (
    <section className="page-section portfolio-page">

      <div className="page-header portfolio-header">
        <div>
          <span className="company-section-eyebrow">
            Investment Overview
          </span>

          <h1>Portfolio</h1>

          <p>
            Track your investments,
            performance, and overall
            portfolio growth.
          </p>
        </div>
      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your portfolio...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        holdings.length === 0 && (
          <div className="page-card portfolio-empty">
            <div className="portfolio-empty-icon">
              $
            </div>

            <h2>
              Your portfolio is empty
            </h2>

            <p>
              Add companies to My
              Holdings to start tracking
              your investments and
              performance.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/holdings')
              }
            >
              View My Holdings
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        holdings.length > 0 && (
          <>
            <div className="portfolio-summary-grid">

              <article className="portfolio-summary-card">
                <span>
                  Total Invested
                </span>

                <strong>
                  {formatMoney(
                    summary.totalInvested
                  )}
                </strong>

                <small>
                  Original investment
                </small>
              </article>

              <article className="portfolio-summary-card primary">
                <span>
                  Current Portfolio Value
                </span>

                <strong>
                  {formatMoney(
                    summary.totalCurrentValue
                  )}
                </strong>

                <small>
                  Latest market value
                </small>
              </article>

              <article
                className={`portfolio-summary-card ${
                  summary.totalProfitLoss >=
                  0
                    ? 'profit'
                    : 'loss'
                }`}
              >
                <span>
                  Total Profit / Loss
                </span>

                <strong>
                  {summary.totalProfitLoss >=
                  0
                    ? '+'
                    : ''}
                  {formatMoney(
                    summary.totalProfitLoss
                  )}
                </strong>

                <small>
                  Overall performance
                </small>
              </article>

              <article
                className={`portfolio-summary-card ${
                  summary.totalReturn >=
                  0
                    ? 'profit'
                    : 'loss'
                }`}
              >
                <span>
                  Overall Return
                </span>

                <strong>
                  {formatPercent(
                    summary.totalReturn
                  )}
                </strong>

                <small>
                  Return on invested capital
                </small>
              </article>

            </div>

            <div className="page-card portfolio-table-card">

              <div className="portfolio-table-header">
                <div>
                  <span className="company-section-eyebrow">
                    Holdings Performance
                  </span>

                  <h2>
                    Investment Breakdown
                  </h2>
                </div>

                <span className="portfolio-count">
                  {holdings.length}{' '}
                  {holdings.length === 1
                    ? 'holding'
                    : 'holdings'}
                </span>
              </div>

              <div className="holdings-table-wrapper">

                <table className="holdings-table portfolio-table">

                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Shares</th>
                      <th>Purchase Price</th>
                      <th>Current Price</th>
                      <th>Invested</th>
                      <th>Current Value</th>
                      <th>P/L</th>
                      <th>Return</th>
                      <th>Purchased</th>
                    </tr>
                  </thead>

                  <tbody>
                    {portfolioRows.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="portfolio-row"
                        >

                          <td>
                            <button
                              type="button"
                              className="portfolio-company-button"
                              onClick={() =>
                                navigateToCompany(
                                  item.symbol
                                )
                              }
                            >
                              <strong>
                                {item.symbol}
                              </strong>

                              <span>
                                {item.stocks
                                  ?.company_name ||
                                  'Unknown company'}
                              </span>
                            </button>
                          </td>

                          <td>
                            {item.quantity}
                          </td>

                          <td>
                            {formatMoney(
                              item.purchasePrice
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              item.currentPrice
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              item.invested
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              item.currentValue
                            )}
                          </td>

                          <td
                            className={
                              item.profitLoss !==
                                null &&
                              item.profitLoss >=
                                0
                                ? 'portfolio-profit'
                                : 'portfolio-loss'
                            }
                          >
                            {item.profitLoss !==
                              null &&
                            item.profitLoss >=
                              0
                              ? '+'
                              : ''}

                            {formatMoney(
                              item.profitLoss
                            )}
                          </td>

                          <td
                            className={
                              item.returnPercent !==
                                null &&
                              item.returnPercent >=
                                0
                                ? 'portfolio-profit'
                                : 'portfolio-loss'
                            }
                          >
                            {formatPercent(
                              item.returnPercent
                            )}
                          </td>

                          <td>
                            {formatDate(
                              item.created_at
                            )}
                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>

            </div>
          </>
        )}

    </section>
  );
}

export default Portfolio;