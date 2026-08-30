import Modal from 'components/Modal';
import React from 'react';
import { useNavigate } from 'react-router';
import recordEvent from 'shared/utils/recordEvent';

export default function ThankYou({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const navigate = useNavigate();

  const queryParamsRef = React.useRef(
    new URLSearchParams(window.location.search)
  );
  const queryParams = queryParamsRef.current;

  React.useEffect(() => {
    // Remove query from url
    void navigate(
      { pathname: window.location.pathname, hash: window.location.hash },
      { replace: true }
    );
  }, [navigate]);

  React.useEffect(() => {
    if (!isOpen) return;

    recordEvent({
      action: 'Completes Credit Purchase',
      category: 'Colorization',
      value: Math.round(
        parseInt(queryParams.get('quantity'), 10) *
          parseInt(queryParams.get('unitPrice'), 10) *
          0.01
      ),
      nonInteraction: true,
    });
  }, [isOpen, queryParams]);

  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Purchase successful</h1>
      <p>Enjoy exploring the 1940s in color!</p>
    </Modal>
  );
}
