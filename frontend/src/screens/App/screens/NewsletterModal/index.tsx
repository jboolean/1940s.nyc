import React, { useState } from 'react';
import api from 'shared/utils/api';
import Button from 'shared/components/Button';
import TextInput from 'shared/components/TextInput';
import Modal from 'shared/components/Modal';
import stylesheet from './NewsletterModal.less';

interface NewsletterModalState {
  isOpen: boolean;
}

const initialState: NewsletterModalState = {
  isOpen: false,
};

let state = initialState;
const listeners: Array<() => void> = [];

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function openNewsletterModal(): void {
  state = { isOpen: true };
  notifyListeners();
}

function closeNewsletterModal(): void {
  state = { isOpen: false };
  notifyListeners();
}

export function useNewsletterModalStore(): NewsletterModalState {
  const [, forceUpdate] = useState({});

  React.useEffect(() => {
    const listener = (): void => forceUpdate({});
    listeners.push(listener);
    return (): void => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return state;
}

export default function NewsletterModal(): JSX.Element {
  const { isOpen } = useNewsletterModalStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/email-campaigns/mailing-list', {
        address: email,
        source: 'map-actions',
      });
      
      setIsSuccess(true);
      setEmail('');
      
      // Close modal after success message
      setTimeout(() => {
        setIsSuccess(false);
        closeNewsletterModal();
      }, 2000);
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setError(null);
      setIsSuccess(false);
      closeNewsletterModal();
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} size="small">
      <div className={stylesheet.modal}>
        <h1>Stay Updated</h1>
        {isSuccess ? (
          <div className={stylesheet.success}>
            <p>✓ Thanks for subscribing!</p>
            <p>You'll receive updates about new photos and features.</p>
          </div>
        ) : (
          <>
            <p>
              Get notifications about new photos, features, and stories from 1940s NYC.
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
            {error && (
              <p className={stylesheet.error}>{error}</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}