import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getStockQuote,
} from '../services/marketData';

const MARKET_SYMBOLS = [
  {
    symbol: 'SPY',
    name: 'S&P 500',
  },
  {
    symbol: 'QQQ',
    name: 'NASDAQ 100',
  },
  {
    symbol: 'DIA',
    name: 'Dow Jones',
  },
];

const POPULAR_SYMBOLS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
  },
  {
    symbol: 'MU',
    name: 'Micron Technology Inc.',
  },
];

function TopCompanies() {
  const navigate = useNavigate();

  const [marketData, setMarketData] =
    useState([]);

  const [popularData, setPopularData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadMarketData() {
      setLoading(true);
      setError('');

      try {
        const marketResults =
          await Promise.all(
            MARKET_SYMBOLS.map(
              async (item) => {
                try {
                  const quote =
                    await getStockQuote(
                      item.symbol
                    );

                  return {
                    ...item,
                    quote,
                  };
                } catch (err) {
                  console.error(
                    `Market quote failed for ${item.symbol}:`,
                    err
                  );

                  return {
                    ...item,
                    quote: null,
                  };
                }
              }
            )
          );

        const popularResults =
          await Promise.all(
            POPULAR_SYMBOLS.map(
              async (item) => {
                try {
                  const quote =
                    await getStockQuote(
                      item.symbol
                    );

                  return {
                    ...item,
                    quote,
                  };
                } catch (err) {
                  console.error(
                    `Popular quote failed for ${item.symbol}:`,
                    err
                  );

                  return {
                    ...item,
                    quote: null,
                  };
                }
              }
            )
          );

        setMarketData(
          marketResults
        );

        setPopularData(
          popularResults
        );
      } catch (err) {
        console.error(
          'Market overview failed:',
          err
        );

        setError(
          err.message ||
            'Unable to load market data.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadMarketData();
  }, []);

  function formatMoney(value) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return '—';
    }

    return `$${number.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatPercent(value) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return '—';
    }

    return `${
      number >= 0
        ? '+'
        : ''
    }${number.toFixed(2)}%`;
  }

  function handleCompanyClick(
    company
  ) {
    if (!company?.symbol) {
      return;
    }

    navigate(
      `/company/${encodeURIComponent(
        company.symbol
      )}`,
      {
        state: {
          company: {
            symbol:
              company.symbol,

            displaySymbol:
              company.symbol,

            companyName:
              company.name ||
              company.symbol,

            exchange:
              company.exchange ||
              '',
          },
        },
      }
    );
  }

  const validCompanies =
    popularData.filter(
      (item) =>
        Number.isFinite(
          Number(
            item.quote?.currentPrice
          )
        )
    );

  const topGainers = [
    ...validCompanies,
  ]
    .filter(
      (item) =>
        Number(
          item.quote?.percentChange
        ) > 0
    )
    .sort(
      (a, b) =>
        Number(
          b.quote?.percentChange
        ) -
        Number(
          a.quote?.percentChange
        )
    )
    .slice(0, 5);

  const topLosers = [
    ...validCompanies,
  ]
    .filter(
      (item) =>
        Number(
          item.quote?.percentChange
        ) < 0
    )
    .sort(
      (a, b) =>
        Number(
          a.quote?.percentChange
        ) -
        Number(
          b.quote?.percentChange
        )
    )
    .slice(0, 5);

  const marketMovers = [
    ...validCompanies,
  ]
    .sort(
      (a, b) =>
        Math.abs(
          Number(
            b.quote?.percentChange
          )
        ) -
        Math.abs(
          Number(
            a.quote?.percentChange
          )
        )
    )
    .slice(0, 5);

  return (
    <section className="page-section top-companies-page">

      <div className="page-header top-companies-header">

        <div>
          <span className="company-section-eyebrow">
            Market Intelligence
          </span>

          <h1>
            Top Companies
          </h1>

          <p>
            Explore market conditions,
            leading companies, and today's
            biggest price movements.
          </p>
        </div>

      </div>

      {loading && (
        <div className="page-card page-status">
          Loading market data...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>

          {/* MARKET OVERVIEW */}

          <section className="market-overview-section">

            <div className="top-companies-section-heading">

              <div>
                <span className="company-section-eyebrow">
                  Market Overview
                </span>

                <h2>
                  Today's Market
                </h2>
              </div>

              <span className="market-live-indicator">
                <span />
                Live
              </span>

            </div>

            <div className="market-overview-grid">

              {marketData.map(
                (item) => {
                  const change =
                    Number(
                      item.quote
                        ?.percentChange
                    );

                  const positive =
                    Number.isFinite(
                      change
                    ) &&
                    change >= 0;

                  return (
                    <button
                      type="button"
                      key={
                        item.symbol
                      }
                      className="market-index-card"
                      onClick={() =>
                        handleCompanyClick(
                          item
                        )
                      }
                    >

                      <div className="market-index-top">

                        <span className="market-index-symbol">
                          {
                            item.symbol
                          }
                        </span>

                        <span
                          className={
                            `market-index-change ${
                              positive
                                ? 'positive'
                                : 'negative'
                            }`
                          }
                        >
                          {formatPercent(
                            item.quote
                              ?.percentChange
                          )}
                        </span>

                      </div>

                      <strong>
                        {formatMoney(
                          item.quote
                            ?.currentPrice
                        )}
                      </strong>

                      <span>
                        {
                          item.name
                        }
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </section>


          {/* GAINERS + LOSERS */}

          <div className="market-columns">

            <section className="page-card market-list-card">

              <div className="market-list-header">

                <div>
                  <span className="company-section-eyebrow">
                    Positive Momentum
                  </span>

                  <h2>
                    Top Gainers
                  </h2>
                </div>

                <span className="market-list-badge positive">
                  ↑
                </span>

              </div>

              <div className="market-company-list">

                {topGainers.length ===
                  0 && (
                  <p className="market-empty">
                    No gainers available.
                  </p>
                )}

                {topGainers.map(
                  (company) => (
                    <button
                      type="button"
                      key={
                        company.symbol
                      }
                      className="market-company-row"
                      onClick={() =>
                        handleCompanyClick(
                          company
                        )
                      }
                    >

                      <div className="market-company-avatar">
                        {
                          company.symbol.slice(
                            0,
                            2
                          )
                        }
                      </div>

                      <div className="market-company-name">

                        <strong>
                          {
                            company.symbol
                          }
                        </strong>

                        <span>
                          {
                            company.name
                          }
                        </span>

                      </div>

                      <div className="market-company-value">

                        <strong>
                          {formatMoney(
                            company.quote
                              ?.currentPrice
                          )}
                        </strong>

                        <span className="positive">
                          {formatPercent(
                            company.quote
                              ?.percentChange
                          )}
                        </span>

                      </div>

                    </button>
                  )
                )}

              </div>

            </section>


            <section className="page-card market-list-card">

              <div className="market-list-header">

                <div>
                  <span className="company-section-eyebrow">
                    Negative Momentum
                  </span>

                  <h2>
                    Top Losers
                  </h2>
                </div>

                <span className="market-list-badge negative">
                  ↓
                </span>

              </div>

              <div className="market-company-list">

                {topLosers.length ===
                  0 && (
                  <p className="market-empty">
                    No losers available.
                  </p>
                )}

                {topLosers.map(
                  (company) => (
                    <button
                      type="button"
                      key={
                        company.symbol
                      }
                      className="market-company-row"
                      onClick={() =>
                        handleCompanyClick(
                          company
                        )
                      }
                    >

                      <div className="market-company-avatar">
                        {
                          company.symbol.slice(
                            0,
                            2
                          )
                        }
                      </div>

                      <div className="market-company-name">

                        <strong>
                          {
                            company.symbol
                          }
                        </strong>

                        <span>
                          {
                            company.name
                          }
                        </span>

                      </div>

                      <div className="market-company-value">

                        <strong>
                          {formatMoney(
                            company.quote
                              ?.currentPrice
                          )}
                        </strong>

                        <span className="negative">
                          {formatPercent(
                            company.quote
                              ?.percentChange
                          )}
                        </span>

                      </div>

                    </button>
                  )
                )}

              </div>

            </section>

          </div>


          {/* MARKET MOVERS */}

          <section className="page-card market-list-card">

            <div className="market-list-header">

              <div>
                <span className="company-section-eyebrow">
                  Price Movement
                </span>

                <h2>
                  Market Movers
                </h2>
              </div>

              <span className="market-list-badge blue">
                Movers
              </span>

            </div>

            <div className="market-active-grid">

              {marketMovers.length ===
                0 && (
                <p className="market-empty">
                  Market movement data is
                  currently unavailable.
                </p>
              )}

              {marketMovers.map(
                (company, index) => {

                  const change =
                    Number(
                      company.quote
                        ?.percentChange
                    );

                  return (
                    <button
                      type="button"
                      key={
                        company.symbol
                      }
                      className="market-active-card"
                      onClick={() =>
                        handleCompanyClick(
                          company
                        )
                      }
                    >

                      <span className="market-rank">
                        #{index + 1}
                      </span>

                      <strong>
                        {
                          company.symbol
                        }
                      </strong>

                      <span>
                        {formatMoney(
                          company.quote
                            ?.currentPrice
                        )}
                      </span>

                      <small
                        className={
                          change >= 0
                            ? 'positive'
                            : 'negative'
                        }
                      >
                        {formatPercent(
                          change
                        )}
                      </small>

                    </button>
                  );
                }
              )}

            </div>

          </section>


          {/* POPULAR COMPANIES */}

          <section className="page-card market-list-card">

            <div className="market-list-header">

              <div>
                <span className="company-section-eyebrow">
                  Investor Favorites
                </span>

                <h2>
                  Popular Companies
                </h2>
              </div>

            </div>

            <div className="popular-company-grid">

              {popularData.map(
                (company) => {

                  const change =
                    Number(
                      company.quote
                        ?.percentChange
                    );

                  const positive =
                    change >= 0;

                  return (
                    <button
                      type="button"
                      key={
                        company.symbol
                      }
                      className="popular-company-card"
                      onClick={() =>
                        handleCompanyClick(
                          company
                        )
                      }
                    >

                      <div className="popular-company-top">

                        <div className="popular-company-avatar">
                          {
                            company.symbol.slice(
                              0,
                              2
                            )
                          }
                        </div>

                        <span
                          className={
                            positive
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {formatPercent(
                            change
                          )}
                        </span>

                      </div>

                      <strong>
                        {
                          company.symbol
                        }
                      </strong>

                      <span>
                        {
                          company.name
                        }
                      </span>

                      <b>
                        {formatMoney(
                          company.quote
                            ?.currentPrice
                        )}
                      </b>

                    </button>
                  );
                }
              )}

            </div>

          </section>

        </>
      )}

    </section>
  );
}

export default TopCompanies;