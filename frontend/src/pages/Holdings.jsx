import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

function Holdings() {
  const { user } = useAuth();

  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHoldings() {
      if (!user) {
        setHoldings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error: holdingsError } =
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
          .order('created_at', {
            ascending: false,
          });

      if (holdingsError) {
        console.error(
          'Holdings query failed:',
          holdingsError
        );

        setError(holdingsError.message);
        setHoldings([]);
      } else {
        setHoldings(data ?? []);
      }

      setLoading(false);
    }

    loadHoldings();
  }, [user]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>My Holdings</h1>

          <p>
            View the stocks currently in your
            portfolio.
          </p>
        </div>
      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your holdings...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          Error: {error}
        </div>
      )}

      {!loading &&
        !error &&
        holdings.length === 0 && (
          <div className="page-card page-empty">
            <h2>No holdings yet</h2>

            <p>
              Your portfolio doesn't have any
              holdings yet.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        holdings.length > 0 && (
          <div className="page-card">
            <div className="holdings-table-wrapper">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Quantity</th>
                    <th>Average Price</th>
                  </tr>
                </thead>

                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.id}>
                      <td>
                        <strong>
                          {holding.stocks?.symbol ||
                            '—'}
                        </strong>
                      </td>

                      <td>
                        {holding.stocks?.company_name ||
                          'Unknown company'}
                      </td>

                      <td>
                        {holding.quantity}
                      </td>

                      <td>
                        $
                        {Number(
                          holding.average_price
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </section>
  );
}

export default Holdings;