import { useState } from 'react';

import { signUpWithEmail } from '../services/auth';


function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const data = await signUpWithEmail(email, password);

      if (data.session) {
        setMessage('Account created successfully.');
      } else {
        setMessage(
          'Account created. Please check your email to confirm your account.'
        );
      }
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Create your investTrack account</h1>

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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </main>
  );
}

export default Register;