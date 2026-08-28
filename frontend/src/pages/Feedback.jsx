import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const FEEDBACK_CATEGORIES = [
  {
    value: 'suggestion',
    label: 'Suggestion',
    description:
      'Share an idea that could improve InvestTrack.',
    icon: '✦',
  },
  {
    value: 'bug',
    label: 'Bug Report',
    description:
      'Tell us about something that is not working correctly.',
    icon: '⚠',
  },
  {
    value: 'general',
    label: 'General Feedback',
    description:
      'Share your overall thoughts about InvestTrack.',
    icon: '◈',
  },
];

function Feedback() {
  const { user } = useAuth();

  const [category, setCategory] =
    useState('suggestion');

  const [rating, setRating] =
    useState(0);

  const [message, setMessage] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState('');

  const [error, setError] =
    useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    setSuccess('');
    setError('');

    if (!user) {
      setError(
        'You must be signed in to submit feedback.'
      );

      return;
    }

    if (!category) {
      setError(
        'Please select a feedback category.'
      );

      return;
    }

    if (!message.trim()) {
      setError(
        'Please enter your feedback.'
      );

      return;
    }

    if (message.trim().length < 10) {
      setError(
        'Please provide a little more detail so we can understand your feedback.'
      );

      return;
    }

    setSubmitting(true);

    try {
      const {
        error: insertError,
      } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          category,
          rating:
            rating > 0
              ? rating
              : null,
          message:
            message.trim(),
        });

      if (insertError) {
        console.error(
          'Feedback submission failed:',
          insertError
        );

        throw insertError;
      }

      setSuccess(
        'Thank you! Your feedback has been sent to the InvestTrack team.'
      );

      setCategory(
        'suggestion'
      );

      setRating(0);
      setMessage('');
    } catch (submitError) {
      setError(
        submitError?.message ||
          'Unable to submit your feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section feedback-page">

      <div className="page-header feedback-header">
        <div>
          <span className="company-section-eyebrow">
            Help us improve
          </span>

          <h1>
            Share Your Feedback
          </h1>

          <p>
            Your feedback helps us make
            InvestTrack more useful, reliable,
            and intuitive.
          </p>
        </div>
      </div>

      <div className="feedback-layout">

        <div className="page-card feedback-form-card">

          <div className="feedback-card-header">
            <div>
              <span className="company-section-eyebrow">
                Your experience
              </span>

              <h2>
                What would you like to tell us?
              </h2>
            </div>
          </div>

          <form
            className="feedback-form"
            onSubmit={handleSubmit}
          >

            <div className="feedback-field">

              <label>
                Feedback Type
              </label>

              <div className="feedback-category-grid">

                {FEEDBACK_CATEGORIES.map(
                  (item) => (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      className={
                        `feedback-category ${
                          category ===
                          item.value
                            ? 'selected'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setCategory(
                          item.value
                        )
                      }
                    >

                      <span className="feedback-category-icon">
                        {
                          item.icon
                        }
                      </span>

                      <span className="feedback-category-content">

                        <strong>
                          {
                            item.label
                          }
                        </strong>

                        <small>
                          {
                            item.description
                          }
                        </small>

                      </span>

                    </button>
                  )
                )}

              </div>

            </div>


            <div className="feedback-field">

              <label>
                How would you rate your experience?
              </label>

              <div
                className="feedback-rating"
                role="radiogroup"
                aria-label="Feedback rating"
              >

                {[1, 2, 3, 4, 5].map(
                  (value) => (
                    <button
                      key={
                        value
                      }
                      type="button"
                      className={
                        value <=
                        rating
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setRating(
                          value
                        )
                      }
                      aria-label={`${value} out of 5`}
                      aria-pressed={
                        value <=
                        rating
                      }
                    >
                      ★
                    </button>
                  )
                )}

                {rating > 0 && (
                  <span>
                    {rating}/5
                  </span>
                )}

              </div>

            </div>


            <div className="feedback-field">

              <label htmlFor="feedback-message">
                Your Feedback
              </label>

              <textarea
                id="feedback-message"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Tell us what you think, what could be improved, or what you would like to see next..."
                rows={7}
                maxLength={2000}
              />

              <div className="feedback-character-count">
                {message.length}/2000
              </div>

            </div>


            {error && (
              <div className="feedback-alert error">
                {error}
              </div>
            )}

            {success && (
              <div className="feedback-alert success">
                <span>✓</span>
                {success}
              </div>
            )}


            <div className="feedback-form-footer">

              <p>
                Your feedback is reviewed by
                the InvestTrack team.
              </p>

              <button
                type="submit"
                className="primary-button feedback-submit-button"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? 'Sending...'
                  : 'Submit Feedback'}
              </button>

            </div>

          </form>

        </div>


        <aside className="feedback-info-card">

          <div className="feedback-info-icon">
            ✦
          </div>

          <span className="company-section-eyebrow">
            InvestTrack
          </span>

          <h2>
            Your voice matters.
          </h2>

          <p>
            Whether you found something that
            could work better, have an idea for
            a new feature, or simply want to
            share your experience, we'd love to
            hear from you.
          </p>

          <div className="feedback-info-list">

            <div>
              <span>01</span>
              <p>
                Tell us what happened.
              </p>
            </div>

            <div>
              <span>02</span>
              <p>
                Share what could improve.
              </p>
            </div>

            <div>
              <span>03</span>
              <p>
                Help shape future updates.
              </p>
            </div>

          </div>

        </aside>

      </div>

    </section>
  );
}

export default Feedback;