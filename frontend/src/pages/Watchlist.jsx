import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';

function Watchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [watchlist, setWatchlist] =
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
    async function loadWatchlist() {
      if (!user) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const {
          data,
          error: watchlistError,
        } = await supabase
          .from('watchlist')
          .select(`
            id,
            stock_id,
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

        if (watchlistError) {
          throw watchlistError;
        }

        const items = data ?? [];

        setWatchlist(items);

        const symbols = [
          ...new Set(
            items
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
          'Watchlist query failed:',
          err
        );

        setError(
          err.message ||
            'Unable to load your watchlist.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, [user]);

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

  function formatChange(value) {
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
    }${number.toFixed(2)}`;
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
    item
  ) {
    const symbol =
      item.stocks?.symbol;

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
              item.stocks
                ?.company_name ||
              symbol,
            exchange:
              item.stocks
                ?.exchange ||
              '',
          },
        },
      }
    );
  }

  function openRemoveConfirmation(
    id
  ) {
    setRemoveError('');
    setRemoveId(id);
  }

  function closeRemoveConfirmation() {
    if (removing) {
      return;
    }

    setRemoveId(null);
    setRemoveError('');
  }

  async function handleRemoveWatchlist() {
    if (!removeId) {
      return;
    }

    setRemoving(true);
    setRemoveError('');

    try {
      const {
        error: deleteError,
      } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', removeId);

      if (deleteError) {
        throw deleteError;
      }

      setWatchlist(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              removeId
          )
      );

      setRemoveId(null);
    } catch (err) {
      console.error(
        'Remove watchlist item failed:',
        err
      );

      setRemoveError(
        err.message ||
          'Unable to remove this company.'
      );
    } finally {
      setRemoving(false);
    }
  }

  const selectedItem =
    watchlist.find(
      (item) =>
        item.id === removeId
    );

  return (
    <section className="page-section watchlist-page">

      <div className="page-header watchlist-header">

        <div>
          <span className="company-section-eyebrow">
            Market Monitoring
          </span>

          <h1>
            Watchlist
          </h1>

          <p>
            Keep an eye on companies
            you're considering for future
            investment.
          </p>
        </div>

        <button
          type="button"
          className="watchlist-add-button"
          onClick={() =>
            navigate('/top-companies')
          }
        >
          + Add Company
        </button>

      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your watchlist...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        watchlist.length === 0 && (
          <div className="page-card watchlist-empty">

            <div className="watchlist-empty-icon">
              ◌
            </div>

            <h2>
              Your watchlist is empty
            </h2>

            <p>
              Add companies you're
              interested in following to
              keep their latest market
              prices close at hand.
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
        watchlist.length > 0 && (
          <div className="page-card watchlist-card">

            <div className="watchlist-card-header">

              <div>
                <span className="company-section-eyebrow">
                  Companies You're Watching
                </span>

                <h2>
                  Market Watchlist
                </h2>
              </div>

              <span className="watchlist-count">
                {watchlist.length}{' '}
                {watchlist.length === 1
                  ? 'company'
                  : 'companies'}
              </span>

            </div>

            <div className="watchlist-list">

              {watchlist.map(
                (item) => {
                  const symbol =
                    item.stocks?.symbol ||
                    '';

                  const quote =
                    prices[symbol];

                  const change =
                    Number(
                      quote?.change
                    );

                  const percentChange =
                    Number(
                      quote?.percentChange
                    );

                  const isPositive =
                    Number.isFinite(
                      percentChange
                    ) &&
                    percentChange >=
                      0;

                  return (
                    <article
                      key={item.id}
                      className="watchlist-row"
                    >

                      <button
                        type="button"
                        className="watchlist-company"
                        onClick={() =>
                          handleCompanyClick(
                            item
                          )
                        }
                      >

                        <div className="watchlist-symbol">
                          {symbol}
                        </div>

                        <div className="watchlist-company-info">

                          <strong>
                            {
                              item.stocks
                                ?.company_name ||
                              'Unknown company'
                            }
                          </strong>

                          <span>
                            {item.stocks
                              ?.exchange ||
                              'Market'}
                          </span>

                        </div>

                      </button>

                      <div className="watchlist-market">

                        <div className="watchlist-price">
                          {formatMoney(
                            quote?.currentPrice
                          )}
                        </div>

                        <div
                          className={`watchlist-change ${
                            isPositive
                              ? 'positive'
                              : 'negative'
                          }`}
                        >
                          <span>
                            {formatChange(
                              change
                            )}
                          </span>

                          <span>
                            {formatPercent(
                              percentChange
                            )}
                          </span>
                        </div>

                      </div>

                      <div className="watchlist-meta">

                        <span>
                          Added{' '}
                          {formatDate(
                            item.created_at
                          )}
                        </span>

                        <button
                          type="button"
                          className="watchlist-remove"
                          onClick={() =>
                            openRemoveConfirmation(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          </div>
        )}

      {removeId && (
        <div
          className="watchlist-modal-backdrop"
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
            className="watchlist-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-watchlist-title"
          >

            <div className="watchlist-confirm-icon">
              !
            </div>

            <h2 id="remove-watchlist-title">
              Remove from Watchlist?
            </h2>

            <p>
              {selectedItem
                ?.stocks
                ?.symbol
                ? `Remove ${selectedItem.stocks.symbol} from your watchlist?`
                : 'Remove this company from your watchlist?'}
            </p>

            <span>
              This only removes the company
              from your Watchlist. It does
              not affect My Holdings or
              Wishlist.
            </span>

            {removeError && (
              <div className="watchlist-remove-error">
                {removeError}
              </div>
            )}

            <div className="watchlist-confirm-actions">

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
                  handleRemoveWatchlist
                }
                disabled={removing}
              >
                {removing
                  ? 'Removing...'
                  : 'Remove'}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Watchlist;