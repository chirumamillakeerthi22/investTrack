import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';

function Holdings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [holdings, setHoldings] =
    useState([]);

  const [prices, setPrices] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [removeId, setRemoveId] =
    useState(null);

  const [removing, setRemoving] =
    useState(false);

  const [removeError, setRemoveError] =
    useState('');

  useEffect(() => {
    async function loadHoldings() {
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
            purchase_date,
            created_at,
            updated_at,
            stocks (
              symbol,
              company_name,
              exchange
            )
          `)
          .order('purchase_date', {
            ascending: false,
          });

        if (holdingsError) {
          throw holdingsError;
        }

        const portfolio =
          data ?? [];

        setHoldings(portfolio);

        const symbols = [
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
            symbols.map(
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
          'Holdings query failed:',
          err
        );

        setError(
          err.message ||
            'Unable to load your holdings.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadHoldings();
  }, [user]);

  const holdingRows = useMemo(() => {
    return holdings.map((holding) => {
      const symbol =
        holding.stocks?.symbol ||
        '';

      const quantity =
        Number(
          holding.quantity
        ) || 0;

      const purchasePrice =
        Number(
          holding.average_price
        ) || 0;

      const currentPrice =
        Number(
          prices[symbol]?.currentPrice
        );

      const invested =
        quantity *
        purchasePrice;

      const currentValue =
        Number.isFinite(
          currentPrice
        )
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
      holdingRows.reduce(
        (total, item) =>
          total + item.invested,
        0
      );

    const totalCurrentValue =
      holdingRows.reduce(
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
  }, [holdingRows]);

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

  function handleCompanyClick(
    holding
  ) {
    const symbol =
      holding.stocks?.symbol;

    if (!symbol) {
      return;
    }

    navigate(
      `/company/${encodeURIComponent(
        symbol
      )}`,
      {
        state: {
          company: {
            symbol,
            displaySymbol:
              symbol,
            companyName:
              holding.stocks
                ?.company_name ||
              symbol,
            exchange:
              holding.stocks
                ?.exchange ||
              '',
          },
        },
      }
    );
  }

  function openRemoveConfirmation(
    holdingId
  ) {
    setRemoveError('');
    setRemoveId(
      holdingId
    );
  }

  function closeRemoveConfirmation() {
    if (removing) {
      return;
    }

    setRemoveId(null);
    setRemoveError('');
  }

  async function handleRemoveHolding() {
    if (!removeId) {
      return;
    }

    setRemoving(true);
    setRemoveError('');

    try {
      const {
        error: deleteError,
      } = await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('id', removeId);

      if (deleteError) {
        throw deleteError;
      }

      setHoldings(
        (current) =>
          current.filter(
            (holding) =>
              holding.id !==
              removeId
          )
      );

      setRemoveId(null);
    } catch (err) {
      console.error(
        'Remove holding failed:',
        err
      );

      setRemoveError(
        err.message ||
          'Unable to remove this holding.'
      );
    } finally {
      setRemoving(false);
    }
  }

  const selectedHolding =
    holdings.find(
      (holding) =>
        holding.id === removeId
    );

  return (
    <section className="page-section holdings-page">

      <div className="page-header holdings-header">
        <div>
          <span className="company-section-eyebrow">
            Investment Positions
          </span>

          <h1>
            My Holdings
          </h1>

          <p>
            Manage the companies you
            currently own and track their
            performance.
          </p>
        </div>

        <button
          type="button"
          className="holdings-add-button"
          onClick={() =>
            navigate('/top-companies')
          }
        >
          + Add Investment
        </button>
      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your holdings...
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
          <div className="page-card holdings-empty">

            <div className="holdings-empty-icon">
              +
            </div>

            <h2>
              No holdings yet
            </h2>

            <p>
              Add a company to My Holdings
              to start tracking your
              investments and performance.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/top-companies'
                )
              }
            >
              Explore Companies
            </button>

          </div>
        )}

      {!loading &&
        !error &&
        holdings.length > 0 && (
          <>
            <div className="holdings-summary-grid">

              <article className="holdings-summary-card">
                <span>
                  Total Invested
                </span>

                <strong>
                  {formatMoney(
                    summary.totalInvested
                  )}
                </strong>

                <small>
                  Amount invested
                </small>
              </article>

              <article className="holdings-summary-card primary">
                <span>
                  Current Value
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
                className={`holdings-summary-card ${
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
                  Overall position
                </small>
              </article>

              <article
                className={`holdings-summary-card ${
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
                  Portfolio performance
                </small>
              </article>

            </div>

            <div className="page-card holdings-table-card">

              <div className="holdings-table-header">

                <div>
                  <span className="company-section-eyebrow">
                    Your Positions
                  </span>

                  <h2>
                    Current Holdings
                  </h2>
                </div>

                <span className="holdings-count">
                  {holdings.length}{' '}
                  {holdings.length === 1
                    ? 'position'
                    : 'positions'}
                </span>

              </div>

              <div className="holdings-table-wrapper">

                <table className="holdings-table">

                  <thead>
                    <tr>
                      <th>
                        Company
                      </th>

                      <th>
                        Shares
                      </th>

                      <th>
                        Purchase Price
                      </th>

                      <th>
                        Current Price
                      </th>

                      <th>
                        Invested
                      </th>

                      <th>
                        Current Value
                      </th>

                      <th>
                        P/L
                      </th>

                      <th>
                        Return
                      </th>

                      <th>
                        Purchase Date
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {holdingRows.map(
                      (holding) => (
                        <tr
                          key={
                            holding.id
                          }
                        >

                          <td>
                            <button
                              type="button"
                              className="holding-company-button"
                              onClick={() =>
                                handleCompanyClick(
                                  holding
                                )
                              }
                            >
                              <strong>
                                {
                                  holding.symbol
                                }
                              </strong>

                              <span>
                                {
                                  holding
                                    .stocks
                                    ?.company_name ||
                                  'Unknown company'
                                }
                              </span>
                            </button>
                          </td>

                          <td>
                            {
                              holding.quantity
                            }
                          </td>

                          <td>
                            {formatMoney(
                              holding.purchasePrice
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              holding.currentPrice
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              holding.invested
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              holding.currentValue
                            )}
                          </td>

                          <td
                            className={
                              holding.profitLoss !==
                                null &&
                              holding.profitLoss >=
                                0
                                ? 'holding-profit'
                                : 'holding-loss'
                            }
                          >
                            {holding.profitLoss !==
                              null &&
                            holding.profitLoss >=
                              0
                              ? '+'
                              : ''}

                            {formatMoney(
                              holding.profitLoss
                            )}
                          </td>

                          <td
                            className={
                              holding.returnPercent !==
                                null &&
                              holding.returnPercent >=
                                0
                                ? 'holding-profit'
                                : 'holding-loss'
                            }
                          >
                            {formatPercent(
                              holding.returnPercent
                            )}
                          </td>

                          <td>
                            {formatDate(
                              holding.purchase_date
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="holding-remove-button"
                              onClick={() =>
                                openRemoveConfirmation(
                                  holding.id
                                )
                              }
                            >
                              Remove
                            </button>
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

      {removeId && (
        <div
          className="holding-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeRemoveConfirmation();
            }
          }}
        >

          <div
            className="holding-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-holding-title"
          >

            <div className="holding-confirm-icon">
              !
            </div>

            <h2 id="remove-holding-title">
              Remove holding?
            </h2>

            <p>
              {selectedHolding
                ?.stocks
                ?.symbol
                ? `Remove ${selectedHolding.stocks.symbol} from your holdings?`
                : 'Remove this holding from your portfolio?'}
            </p>

            <span>
              This removes the investment
              record from your InvestTrack
              portfolio. It does not delete
              the company or affect your
              Watchlist or Wishlist.
            </span>

            {removeError && (
              <div className="holding-remove-error">
                {removeError}
              </div>
            )}

            <div className="holding-confirm-actions">

              <button
                type="button"
                onClick={
                  closeRemoveConfirmation
                }
                disabled={removing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={
                  handleRemoveHolding
                }
                disabled={removing}
              >
                {removing
                  ? 'Removing...'
                  : 'Remove Holding'}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Holdings;