import React from 'react';
import Button from 'shared/components/Button';
import TextInput from 'shared/components/TextInput';
import Modal from 'shared/components/Modal';
import stylesheet from './NewsletterModal.less';
import useNewsletterModalStore from './stores/NewsletterModalStore';

export default function NewsletterModal(): JSX.Element {
  const {
    isOpen,
    email,
    isSubmitting,
    isSuccess,
    errorMessage,
    close,
    setEmail,
    handleSubmit,
  } = useNewsletterModalStore();

  const handleClose = (): void => {
    if (!isSubmitting) {
      close();
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} size="small">
      <div className={stylesheet.modal}>
        <h1>Stay Updated</h1>
        {isSuccess ? (
          <div className={stylesheet.success}>
            <p>✓ Thanks for subscribing!</p>
            <p>
              You&apos;ll be the first to know about new ways to explore old New
              York.
            </p>
          </div>
        ) : (
          <>
            <p>
              Sign up to be notified about new features and other updates to{' '}
              <i>1940s.nyc</i>. I send a newsletter about twice a year.
            </p>
            <form onSubmit={handleSubmit} className={stylesheet.form}>
              <TextInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                type="email"
                disabled={isSubmitting}
              />
              <div className={stylesheet.buttons}>
                <Button
                  buttonStyle="primary"
                  type="submit"
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </form>
            {errorMessage && <p className={stylesheet.error}>{errorMessage}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

export function openNewsletterModal(): void {
  useNewsletterModalStore.getState().open();
}
