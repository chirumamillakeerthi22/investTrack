import { useState } from 'react';
import { Link } from 'react-router-dom';

import { signUpWithEmail } from '../services/auth';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await signUpWithEmail(
          email.trim(),
          password
        );

      if (data.session) {
        setMessage(
          'Your account has been created successfully.'
        );
      } else {
        setMessage(
          'Account created. Check your email to confirm your account.'
        );
      }
    } catch (err) {
      console.error(
        'Registration failed:',
        err
      );

      setError(
        err.message ||
        'Unable to create your account.'
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
            <h1>Create your account</h1>

            <p>
              Start managing your investments
              with investTrack.
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={6}
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

              <span className="form-hint">
                Use at least 6 characters.
              </span>
            </div>

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="auth-message auth-message-success"
                role="status"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Creating account...'
                : 'Create account'}
            </button>

          </form>

          <div className="auth-footer">
            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in
            </Link>
          </div>

        </section>

        <p className="auth-legal">
          By creating an account, you agree to
          use investTrack responsibly.
        </p>

      </div>
    </main>
  );
}

export default Register;