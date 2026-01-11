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
    reset,
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
            <p>You&apos;ll receive updates about new photos and features.</p>
          </div>
        ) : (
          <>
            <p>
              Get notifications about new photos, features, and stories from
              1940s NYC.
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
