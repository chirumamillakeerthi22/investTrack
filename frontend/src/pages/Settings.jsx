import {
  useMemo,
  useState,
} from 'react';

import {
  useTheme,
} from '../context/ThemeContext';

import {
  updatePassword,
  verifyCurrentPassword,
} from '../services/auth';

import { useAuth } from '../context/AuthContext';

function Settings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmNewPassword, setConfirmNewPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmNewPassword, setShowConfirmNewPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState('');

  const [passwordSuccess, setPasswordSuccess] =
    useState('');

  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const {
    theme,
    setTheme,
  } = useTheme();

  const memberSince = useMemo(() => {
    if (!user?.created_at) {
      return '—';
    }

    return new Date(
      user.created_at
    ).toLocaleDateString(
      undefined,
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }, [user]);

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    setPasswordError('');
    setPasswordSuccess('');

    if (!user?.email) {
      setPasswordError(
        'Unable to determine your account email.'
      );

      return;
    }

    if (
      newPassword.length < 8
    ) {
      setPasswordError(
        'Your new password must be at least 8 characters.'
      );

      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setPasswordError(
        'The new passwords do not match.'
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setPasswordError(
        'Your new password must be different from your current password.'
      );

      return;
    }

    setPasswordLoading(true);

    try {
      await verifyCurrentPassword(
        user.email,
        currentPassword
      );

      await updatePassword(
        newPassword
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setPasswordSuccess(
        'Your password has been changed successfully.'
      );
    } catch (err) {
      console.error(
        'Change password failed:',
        err
      );

      setPasswordError(
        err.message ===
          'Invalid login credentials'
          ? 'Your current password is incorrect.'
          : err.message ||
          'Unable to change your password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="page-section settings-page">

      <div className="page-header settings-header">
        <div>
          <span className="company-section-eyebrow">
            Account preferences
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your InvestTrack account
            and application preferences.
          </p>
        </div>
      </div>

      <div className="settings-layout">

        {/* ACCOUNT */}

        <section className="page-card settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              👤
            </div>

            <div>
              <span className="company-section-eyebrow">
                Account
              </span>

              <h2>
                Account Information
              </h2>

              <p>
                Your basic InvestTrack account
                information.
              </p>
            </div>

          </div>

          <div className="settings-details">

            <div className="settings-detail-row">
              <span>
                Email address
              </span>

              <strong>
                {user?.email || '—'}
              </strong>
            </div>

            <div className="settings-detail-row">
              <span>
                Member since
              </span>

              <strong>
                {memberSince}
              </strong>
            </div>

            <div className="settings-detail-row">
              <span>
                Account status
              </span>

              <strong className="settings-status">
                <span />
                Active
              </strong>
            </div>

          </div>

        </section>

        <section className="page-card settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              ◐
            </div>

            <div className="settings-card-header-content">

              <span className="company-section-eyebrow">
                Appearance
              </span>

              <h2>
                Theme
              </h2>

              <p>
                Choose how InvestTrack looks on your
                device.
              </p>

            </div>

          </div>

          <div className="theme-selector">

            <button
              type="button"
              className={
                `theme-option ${theme === 'light'
                  ? 'selected'
                  : ''
                }`
              }
              onClick={() =>
                setTheme('light')
              }
            >

              <div className="theme-preview theme-preview-light">

                <div className="theme-preview-top" />

                <div className="theme-preview-content">

                  <span />
                  <span />
                  <span />

                </div>

              </div>

              <div className="theme-option-info">

                <strong>
                  Light
                </strong>

                <span>
                  Clean and bright
                </span>

              </div>

              <div className="theme-radio">
                {theme === 'light'
                  ? '✓'
                  : ''}
              </div>

            </button>


            <button
              type="button"
              className={
                `theme-option ${theme === 'dark'
                  ? 'selected'
                  : ''
                }`
              }
              onClick={() =>
                setTheme('dark')
              }
            >

              <div className="theme-preview theme-preview-dark">

                <div className="theme-preview-top" />

                <div className="theme-preview-content">

                  <span />
                  <span />
                  <span />

                </div>

              </div>

              <div className="theme-option-info">

                <strong>
                  Dark
                </strong>

                <span>
                  Comfortable in low light
                </span>

              </div>

              <div className="theme-radio">
                {theme === 'dark'
                  ? '✓'
                  : ''}
              </div>

            </button>


            <button
              type="button"
              className={
                `theme-option ${theme === 'system'
                  ? 'selected'
                  : ''
                }`
              }
              onClick={() =>
                setTheme('system')
              }
            >

              <div className="theme-preview theme-preview-system">

                <div className="theme-preview-half light-half" />

                <div className="theme-preview-half dark-half" />

              </div>

              <div className="theme-option-info">

                <strong>
                  System
                </strong>

                <span>
                  Follow your device
                </span>

              </div>

              <div className="theme-radio">
                {theme === 'system'
                  ? '✓'
                  : ''}
              </div>

            </button>

          </div>

        </section>

        <section className="page-card settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              🔐
            </div>

            <div className="settings-card-header-content">
              <span className="company-section-eyebrow">
                Security
              </span>

              <h2>
                Change Password
              </h2>

              <p>
                Update your password while keeping
                your account secure.
              </p>
            </div>

          </div>

          {!showChangePassword ? (

            <div className="settings-password-collapsed">

              <div>
                <strong>
                  Keep your account secure
                </strong>

                <span>
                  Change your password whenever you
                  need to update your account security.
                </span>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowChangePassword(true)
                }
              >
                Change password
              </button>

            </div>

          ) : (

            <form
              className="settings-password-form"
              onSubmit={handleChangePassword}
            >

              <div className="settings-password-grid">

                <div className="form-field">

                  <label htmlFor="current-password">
                    Current password
                  </label>

                  <div className="password-field">

                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? 'text'
                          : 'password'
                      }
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showCurrentPassword
                        ? 'Hide'
                        : 'Show'}
                    </button>

                  </div>

                </div>


                <div className="form-field">

                  <label htmlFor="settings-new-password">
                    New password
                  </label>

                  <div className="password-field">

                    <input
                      id="settings-new-password"
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showNewPassword
                        ? 'Hide'
                        : 'Show'}
                    </button>

                  </div>

                </div>


                <div className="form-field">

                  <label htmlFor="confirm-new-password">
                    Confirm new password
                  </label>

                  <div className="password-field">

                    <input
                      id="confirm-new-password"
                      type={
                        showConfirmNewPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmNewPassword}
                      onChange={(event) =>
                        setConfirmNewPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmNewPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showConfirmNewPassword
                        ? 'Hide'
                        : 'Show'}
                    </button>

                  </div>

                </div>

              </div>


              <p className="password-requirement">
                Use at least 8 characters and choose
                a password you do not use elsewhere.
              </p>


              {passwordError && (
                <div className="auth-message auth-message-error">
                  {passwordError}
                </div>
              )}


              {passwordSuccess && (
                <div className="auth-message auth-message-success">
                  {passwordSuccess}
                </div>
              )}


              <div className="settings-password-footer">

                <button
                  type="button"
                  className="settings-cancel-button"
                  onClick={() => {
                    setShowChangePassword(false);

                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');

                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? 'Updating...'
                    : 'Update password'}
                </button>

              </div>

            </form>

          )}

        </section>


        {/* PREFERENCES */}

        <section className="page-card settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              ◈
            </div>

            <div>
              <span className="company-section-eyebrow">
                Experience
              </span>

              <h2>
                Application Preferences
              </h2>

              <p>
                Preferences for how InvestTrack
                presents information.
              </p>
            </div>

          </div>

          <div className="settings-preference-list">

            <div className="settings-preference">

              <div>
                <strong>
                  Market data
                </strong>

                <span>
                  Display the latest available
                  market information.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

            <div className="settings-preference">

              <div>
                <strong>
                  Portfolio tracking
                </strong>

                <span>
                  Track holdings and investment
                  performance inside InvestTrack.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

            <div className="settings-preference">

              <div>
                <strong>
                  Company insights
                </strong>

                <span>
                  Access company details,
                  historical charts, and market
                  information.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

          </div>

        </section>


        {/* SECURITY */}

        <section className="page-card settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              ◉
            </div>

            <div>
              <span className="company-section-eyebrow">
                Security
              </span>

              <h2>
                Account Security
              </h2>

              <p>
                Your authentication is securely
                managed through your InvestTrack
                account.
              </p>
            </div>

          </div>

          <div className="settings-security">

            <div className="settings-security-row">

              <div>
                <strong>
                  Authentication
                </strong>

                <span>
                  Your account is protected by
                  secure authentication.
                </span>
              </div>

              <span className="settings-security-badge">
                Secure
              </span>

            </div>

            <div className="settings-security-row">

              <div>
                <strong>
                  Session
                </strong>

                <span>
                  You are currently signed in to
                  InvestTrack.
                </span>
              </div>

              <span className="settings-security-badge">
                Active
              </span>

            </div>

          </div>

        </section>


        {/* INFORMATION */}

        <section className="settings-info-panel">

          <div className="settings-info-mark">
            ✦
          </div>

          <div>

            <span className="company-section-eyebrow">
              InvestTrack
            </span>

            <h2>
              Built for smarter
              investment tracking.
            </h2>

            <p>
              InvestTrack helps you monitor
              companies, organize holdings,
              follow opportunities, and
              understand portfolio performance
              in one place.
            </p>

          </div>

        </section>

      </div>

    </section>
  );
}

export default Settings;