import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuthenticatedUser,
  getUserProfile,
 } from '../services/api';

import { signInWithEmail } from '../services/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const data = await signInWithEmail(email, password);

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error('Login succeeded, but no access token was returned.');
      }

      const authenticatedUser = await getAuthenticatedUser(
        accessToken
      );

      const profile = await getUserProfile(
        accessToken
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main>
      <h1>Welcome to investTrack</h1>

      <p>Sign in to your investment portfolio.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </main>
  );
}

export default Login;