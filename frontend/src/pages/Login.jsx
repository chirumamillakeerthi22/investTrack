import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { signInWithEmail } from '../services/auth';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const data = await signInWithEmail(
        email.trim(),
        password
      );

      if (!data?.session) {
        throw new Error(
          'Login succeeded, but no authentication session was returned.'
        );
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);

      setError(
        err.message || 'Unable to sign in.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">

        <div className="auth-brand">
          <div className="auth-brand-mark">
            iT
          </div>

          <span>investTrack</span>
        </div>

        <section className="auth-card">

          <div className="auth-header">
            <h1>Welcome back</h1>

            <p>
              Sign in to continue managing
              your investments.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-field">
                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>

          </form>

          <div className="auth-footer">
            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create an account
            </Link>
          </div>

        </section>

        <p className="auth-legal">
          Secure authentication powered by
          Supabase.
        </p>

      </div>
    </main>
  );
}

export default Login;