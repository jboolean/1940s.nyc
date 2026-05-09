import Modal from 'components/Modal';
import qs from 'qs';
import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import recordEvent from 'shared/utils/recordEvent';

export default function ThankYou({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const navigate = useNavigate();
  const { tipAmount } = qs.parse(window.location.search);
  const hasRecordedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen || hasRecordedRef.current) return;
    recordEvent({
      action: 'Completes Tip',
      category: 'Tip Jar',
      value: Number(tipAmount),
      nonInteraction: true,
    });
    window.localStorage.setItem('hasTipped', 'true');

    // Remove query from url
    navigate(
      { pathname: window.location.pathname, hash: window.location.hash },
      { replace: true }
    );
    hasRecordedRef.current = true;
  }, [tipAmount, isOpen, navigate]);

  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Thank you</h1>
      <p>Thank you so much for you helping out!</p>
      <p>
        <em>– Julian</em>
      </p>
    </Modal>
  );
}
