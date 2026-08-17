import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

function Dashboard() {
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        return;
      }

      setError('');

      // --------------------------------------------------
      // Load current user's profile
      // --------------------------------------------------

      const { data: profileData, error: profileError } =
        await supabase
          .from('users')
          .select('id, email, created_at')
          .eq('id', user.id)
          .single();

      if (profileError) {
        console.error('Profile query failed:', profileError);
        setError(profileError.message);
        return;
      }

      setProfile(profileData);

      // --------------------------------------------------
      // Load stocks
      // --------------------------------------------------

      const { data: stockData, error: stockError } =
        await supabase
          .from('stocks')
          .select('id, symbol, company_name, exchange')
          .order('symbol')
          .limit(10);

      if (stockError) {
        console.error('Stock query failed:', stockError);
        setError(stockError.message);
        return;
      }

      setStocks(stockData ?? []);

      // --------------------------------------------------
      // Load portfolio holdings
      // --------------------------------------------------

      const { data: holdingData, error: holdingError } =
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
          .order('created_at', { ascending: false });

      if (holdingError) {
        console.error(
          'Portfolio query failed:',
          holdingError
        );
        setError(holdingError.message);
        return;
      }

      setHoldings(holdingData ?? []);

      // --------------------------------------------------
      // Load watchlist
      // --------------------------------------------------

      const { data: watchlistData, error: watchlistError } =
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
          .order('created_at', { ascending: false });

      if (watchlistError) {
        console.error(
          'Watchlist query failed:',
          watchlistError
        );
        setError(watchlistError.message);
        return;
      }

      setWatchlist(watchlistData ?? []);

      // --------------------------------------------------
      // Load wishlist
      // --------------------------------------------------

      const { data: wishlistData, error: wishlistError } =
        await supabase
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
          .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error(
          'Wishlist query failed:',
          wishlistError
        );
        setError(wishlistError.message);
        return;
      }

      setWishlist(wishlistData ?? []);

      // --------------------------------------------------
      // Load feedback
      // --------------------------------------------------

      const { data: feedbackData, error: feedbackError } =
        await supabase
          .from('feedback')
          .select(`
            id,
            category,
            rating,
            message,
            created_at
          `)
          .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error(
          'Feedback query failed:',
          feedbackError
        );
        setError(feedbackError.message);
        return;
      }

      setFeedback(feedbackData ?? []);
    }

    loadDashboardData();
  }, [user]);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <main>
      <h1>investTrack Dashboard</h1>

      {/* ------------------------------------------------ */}
      {/* Profile                                          */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Profile</h2>

        {profile ? (
          <>
            <p>Profile loaded successfully.</p>
            <p>User ID: {profile.id}</p>
            <p>Email: {profile.email}</p>
          </>
        ) : (
          <p>Loading profile...</p>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Stocks                                           */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Stocks</h2>

        {stocks.length === 0 ? (
          <p>No stocks available.</p>
        ) : (
          <ul>
            {stocks.map((stock) => (
              <li key={stock.id}>
                {stock.symbol} — {stock.company_name}
                {stock.exchange
                  ? ` (${stock.exchange})`
                  : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Portfolio Holdings                               */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Portfolio Holdings</h2>

        {holdings.length === 0 ? (
          <p>No portfolio holdings yet.</p>
        ) : (
          <ul>
            {holdings.map((holding) => (
              <li key={holding.id}>
                {holding.stocks?.symbol} —{' '}
                {holding.quantity} shares @ $
                {holding.average_price}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Watchlist                                        */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Watchlist</h2>

        {watchlist.length === 0 ? (
          <p>Watchlist is empty.</p>
        ) : (
          <ul>
            {watchlist.map((item) => (
              <li key={item.id}>
                {item.stocks?.symbol} —{' '}
                {item.stocks?.company_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Wishlist                                         */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Wishlist</h2>

        {wishlist.length === 0 ? (
          <p>Wishlist is empty.</p>
        ) : (
          <ul>
            {wishlist.map((item) => (
              <li key={item.id}>
                {item.stocks?.symbol} —{' '}
                {item.stocks?.company_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Feedback                                         */}
      {/* ------------------------------------------------ */}

      <section>
        <h2>Feedback</h2>

        {feedback.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          <ul>
            {feedback.map((item) => (
              <li key={item.id}>
                <strong>{item.category}</strong>

                {item.rating !== null &&
                  ` — Rating: ${item.rating}`}

                <br />

                {item.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* Errors                                           */}
      {/* ------------------------------------------------ */}

      {error && <p>Error: {error}</p>}

      {/* ------------------------------------------------ */}
      {/* Logout                                           */}
      {/* ------------------------------------------------ */}

      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default Dashboard;