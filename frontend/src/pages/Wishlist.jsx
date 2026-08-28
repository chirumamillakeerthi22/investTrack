import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getStockQuote } from '../services/marketData';

function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] =
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
    async function loadWishlist() {
      if (!user) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const {
          data,
          error: wishlistError,
        } = await supabase
          .from('wishlist')
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

        if (wishlistError) {
          throw wishlistError;
        }

        const items = data ?? [];

        setWishlist(items);

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
          'Wishlist query failed:',
          err
        );

        setError(
          err.message ||
            'Unable to load your wishlist.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
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

  async function handleRemoveWishlist() {
    if (!removeId) {
      return;
    }

    setRemoving(true);
    setRemoveError('');

    try {
      const {
        error: deleteError,
      } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', removeId);

      if (deleteError) {
        throw deleteError;
      }

      setWishlist(
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
        'Remove wishlist item failed:',
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
    wishlist.find(
      (item) =>
        item.id === removeId
    );

  return (
    <section className="page-section wishlist-page">

      <div className="page-header wishlist-header">

        <div>
          <span className="company-section-eyebrow">
            Future Investments
          </span>

          <h1>
            Wishlist
          </h1>

          <p>
            Save companies you'd love to
            own and revisit them when the
            time is right.
          </p>
        </div>

        <button
          type="button"
          className="wishlist-add-button"
          onClick={() =>
            navigate('/top-companies')
          }
        >
          + Add Company
        </button>

      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your wishlist...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        wishlist.length === 0 && (
          <div className="page-card wishlist-empty">

            <div className="wishlist-empty-icon">
              ☆
            </div>

            <h2>
              Your wishlist is waiting
            </h2>

            <p>
              Add companies you're
              interested in owning someday.
              They'll stay here until you're
              ready to take the next step.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/top-companies'
                )
              }
            >
              Discover Companies
            </button>

          </div>
        )}

      {!loading &&
        !error &&
        wishlist.length > 0 && (
          <div className="page-card wishlist-card">

            <div className="wishlist-card-header">

              <div>
                <span className="company-section-eyebrow">
                  Saved For Later
                </span>

                <h2>
                  Companies I Want to Own
                </h2>
              </div>

              <span className="wishlist-count">
                {wishlist.length}{' '}
                {wishlist.length === 1
                  ? 'company'
                  : 'companies'}
              </span>

            </div>

            <div className="wishlist-list">

              {wishlist.map(
                (item) => {
                  const symbol =
                    item.stocks?.symbol ||
                    '';

                  const quote =
                    prices[symbol];

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
                      className="wishlist-row"
                    >

                      <button
                        type="button"
                        className="wishlist-company"
                        onClick={() =>
                          handleCompanyClick(
                            item
                          )
                        }
                      >

                        <div className="wishlist-symbol">
                          ☆
                        </div>

                        <div className="wishlist-company-info">

                          <strong>
                            {
                              item.stocks
                                ?.company_name ||
                              'Unknown company'
                            }
                          </strong>

                          <span>
                            {symbol}
                            {' · '}
                            {item.stocks
                              ?.exchange ||
                              'Market'}
                          </span>

                        </div>

                      </button>

                      <div className="wishlist-price-block">

                        <span>
                          Current Price
                        </span>

                        <strong>
                          {formatMoney(
                            quote?.currentPrice
                          )}
                        </strong>

                      </div>

                      <div
                        className={`wishlist-change ${
                          isPositive
                            ? 'positive'
                            : 'negative'
                        }`}
                      >
                        {formatPercent(
                          percentChange
                        )}
                      </div>

                      <div className="wishlist-meta">

                        <span>
                          Added{' '}
                          {formatDate(
                            item.created_at
                          )}
                        </span>

                        <button
                          type="button"
                          className="wishlist-remove"
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
          className="wishlist-modal-backdrop"
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
            className="wishlist-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-wishlist-title"
          >

            <div className="wishlist-confirm-icon">
              !
            </div>

            <h2 id="remove-wishlist-title">
              Remove from Wishlist?
            </h2>

            <p>
              {selectedItem
                ?.stocks
                ?.symbol
                ? `Remove ${selectedItem.stocks.symbol} from your wishlist?`
                : 'Remove this company from your wishlist?'}
            </p>

            <span>
              This only removes the company
              from your Wishlist. It does
              not affect My Holdings or
              Watchlist.
            </span>

            {removeError && (
              <div className="wishlist-remove-error">
                {removeError}
              </div>
            )}

            <div className="wishlist-confirm-actions">

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
                  handleRemoveWishlist
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

export default Wishlist;