import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

function Wishlist() {
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWishlist() {
      if (!user) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

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
            company_name
          )
        `)
        .order('created_at', {
          ascending: false,
        });

      if (wishlistError) {
        console.error(
          'Wishlist query failed:',
          wishlistError
        );

        setError(wishlistError.message);
        setWishlist([]);
      } else {
        setWishlist(data ?? []);
      }

      setLoading(false);
    }

    loadWishlist();
  }, [user]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Wishlist</h1>

          <p>
            Keep track of companies you're
            considering for the future.
          </p>
        </div>
      </div>

      {loading && (
        <div className="page-card page-status">
          Loading your wishlist...
        </div>
      )}

      {error && (
        <div className="page-card page-error">
          Error: {error}
        </div>
      )}

      {!loading &&
        !error &&
        wishlist.length === 0 && (
          <div className="page-card page-empty">
            <h2>Your wishlist is empty</h2>

            <p>
              Search for a company above to add
              it to your wishlist.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        wishlist.length > 0 && (
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
                  {wishlist.map((item) => (
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

export default Wishlist;