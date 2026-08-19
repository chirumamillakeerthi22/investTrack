import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

function Watchlist() {
  const { user } = useAuth();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWatchlist() {
      if (!user) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error: watchlistError } =
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
          .order('created_at', {
            ascending: false,
          });

      if (watchlistError) {
        console.error(
          'Watchlist query failed:',
          watchlistError
        );

        setError(watchlistError.message);
        setWatchlist([]);
      } else {
        setWatchlist(data ?? []);
      }

      setLoading(false);
    }

    loadWatchlist();
  }, [user]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Watchlist</h1>

          <p>
            Monitor companies you're interested
            in following.
          </p>
        </div>
      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your watchlist...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          Error: {error}
        </div>
      )}

      {!loading &&
        !error &&
        watchlist.length === 0 && (
          <div className="page-card page-empty">
            <h2>Your watchlist is empty</h2>

            <p>
              Search for a company above to start
              monitoring it.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        watchlist.length > 0 && (
          <div className="page-card">
            <div className="holdings-table-wrapper">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Added</th>
                  </tr>
                </thead>

                <tbody>
                  {watchlist.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.stocks?.symbol ||
                            '—'}
                        </strong>
                      </td>

                      <td>
                        {item.stocks?.company_name ||
                          'Unknown company'}
                      </td>

                      <td>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleDateString()
                          : '—'}
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

export default Watchlist;