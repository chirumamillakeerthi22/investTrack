import { useState } from 'react';
import {
  useNavigate,
} from 'react-router-dom';

import {
  updatePassword,
} from '../services/auth';

function ResetPassword() {
  const navigate =
    useNavigate();

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError(
        'Your new password must be at least 8 characters.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'The passwords do not match.'
      );

      return;
    }

    setLoading(true);

    try {
      await updatePassword(
        password
      );

      setSuccess(
        'Your password has been updated successfully.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err) {
      console.error(
        'Password update failed:',
        err
      );

      setError(
        err.message ||
          'Unable to update your password.'
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

          <span>
            investTrack
          </span>
        </div>

        <section className="auth-card">

          <div className="auth-header">

            <h1>
              Create a new password
            </h1>

            <p>
              Choose a strong password
              to secure your InvestTrack
              account.
            </p>

          </div>

          <form
            className="auth-form"
            onSubmit={
              handleSubmit
            }
          >

            <div className="form-field">

              <label htmlFor="new-password">
                New password
              </label>

              <div className="password-field">

                <input
                  id="new-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>

            </div>

            <div className="form-field">

              <label htmlFor="confirm-password">
                Confirm new password
              </label>

              <div className="password-field">

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                >
                  {showConfirmPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>

            </div>

            <div className="password-requirement">
              Use at least 8 characters.
            </div>

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="auth-message auth-message-success"
                role="status"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={
                loading
              }
            >
              {loading
                ? 'Updating...'
                : 'Update password'}
            </button>

          </form>

        </section>

        <p className="auth-legal">
          Secure authentication powered
          by Supabase.
        </p>

      </div>

    </main>
  );
}

export default ResetPassword;