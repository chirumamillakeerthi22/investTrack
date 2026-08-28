import {
  useEffect,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getStockQuote,
} from '../services/marketData';

import { ensureStock } from '../services/stocks';
import { supabase } from '../services/supabase';

function AddHolding() {
  const { symbol } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const company = location.state?.company;

  const displaySymbol = symbol
    ? decodeURIComponent(symbol).toUpperCase()
    : '';

  const companyName =
    company?.companyName ||
    company?.description ||
    displaySymbol;

  const companyExchange =
    company?.exchange || '';

  const [quote, setQuote] =
    useState(
      location.state?.quote || null
    );

  const [quoteLoading, setQuoteLoading] =
    useState(!quote);

  const [quoteError, setQuoteError] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [purchasePrice, setPurchasePrice] =
    useState('');

  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadQuote() {
      if (
        quote ||
        !displaySymbol
      ) {
        setQuoteLoading(false);
        return;
      }

      setQuoteLoading(true);
      setQuoteError('');

      try {
        const data =
          await getStockQuote(
            displaySymbol
          );

        setQuote(data);

        if (
          data?.currentPrice !==
            undefined &&
          data?.currentPrice !== null &&
          !purchasePrice
        ) {
          setPurchasePrice(
            String(data.currentPrice)
          );
        }
      } catch (err) {
        console.error(
          'Add holding quote failed:',
          err
        );

        setQuoteError(
          err.message ||
            'Unable to load current market price.'
        );
      } finally {
        setQuoteLoading(false);
      }
    }

    loadQuote();
  }, [
    displaySymbol,
    quote,
    purchasePrice,
  ]);

  useEffect(() => {
    if (
      quote?.currentPrice !==
        undefined &&
      quote?.currentPrice !== null &&
      !purchasePrice
    ) {
      setPurchasePrice(
        String(quote.currentPrice)
      );
    }
  }, [
    quote,
    purchasePrice,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!quantity || Number(quantity) <= 0) {
      setError(
        'Enter a valid number of shares.'
      );
      return;
    }

    if (
      !purchasePrice ||
      Number(purchasePrice) <= 0
    ) {
      setError(
        'Enter a valid purchase price.'
      );
      return;
    }

    if (!purchaseDate) {
      setError(
        'Select a purchase date.'
      );
      return;
    }

    setSaving(true);

    try {
      const stock =
        await ensureStock({
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

      const { error: insertError } =
        await supabase
          .from('portfolio_holdings')
          .insert({
            stock_id: stock.id,
            quantity: Number(quantity),
            average_price: Number(purchasePrice),
            purchase_date: purchaseDate,
          });

      if (insertError) {
        throw insertError;
      }

      navigate(
        '/holdings',
        { replace: true }
      );
    } catch (err) {
      console.error(
        'Add holding failed:',
        err
      );

      setError(
        err.message ||
          'Unable to add holding.'
      );
    } finally {
      setSaving(false);
    }
  }

  const currentPrice =
    Number(
      quote?.currentPrice
    );

  return (
    <main className="page-content">

      <section className="page-card add-holding-page">

        <button
          type="button"
          className="add-holding-back"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back to Company
        </button>

        <div className="add-holding-header">
          <span className="company-section-eyebrow">
            Investment Tracking
          </span>

          <h1>
            Add to My Holdings
          </h1>

          <p>
            Record your investment in
            {` ${companyName}`}.
          </p>
        </div>

        <div className="add-holding-company">

          <div>
            <span>
              Stock
            </span>

            <strong>
              {displaySymbol}
            </strong>

            <small>
              {companyExchange ||
                'Market'}
            </small>
          </div>

          <div>
            <span>
              Current Market Price
            </span>

            {quoteLoading ? (
              <strong>
                Loading...
              </strong>
            ) : quoteError ? (
              <strong>
                —
              </strong>
            ) : (
              <strong>
                {Number.isFinite(
                  currentPrice
                )
                  ? `$${currentPrice.toFixed(2)}`
                  : '—'}
              </strong>
            )}
          </div>

        </div>

        <div className="add-holding-notice">
          <strong>
            Portfolio tracking only
          </strong>

          <p>
            Adding a holding records your
            investment for tracking. It does
            not buy or sell shares and does
            not connect to a brokerage.
          </p>
        </div>

        <form
          className="add-holding-form"
          onSubmit={handleSubmit}
        >

          <div className="add-holding-field">

            <label htmlFor="quantity">
              Number of Shares
            </label>

            <input
              id="quantity"
              type="number"
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
              placeholder="e.g. 10"
              required
            />

          </div>

          <div className="add-holding-field">

            <label htmlFor="purchase-price">
              Purchase Price per Share
            </label>

            <input
              id="purchase-price"
              type="number"
              min="0.01"
              step="0.01"
              value={purchasePrice}
              onChange={(event) =>
                setPurchasePrice(
                  event.target.value
                )
              }
              placeholder="e.g. 295.50"
              required
            />

          </div>

          <div className="add-holding-field">

            <label htmlFor="purchase-date">
              Purchase Date
            </label>

            <input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(event) =>
                setPurchaseDate(
                  event.target.value
                )
              }
              required
            />

          </div>

          {quantity &&
            purchasePrice && (
              <div className="add-holding-summary">

                <span>
                  Total Invested
                </span>

                <strong>
                  $
                  {(
                    Number(quantity) *
                    Number(purchasePrice)
                  ).toFixed(2)}
                </strong>

              </div>
            )}

          {error && (
            <div className="add-holding-error">
              {error}
            </div>
          )}

          <div className="add-holding-actions">

            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Add to My Holdings'}
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}

export default AddHolding;