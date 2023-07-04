import Modal from 'components/Modal';
import React from 'react';
import { useHistory } from 'react-router-dom';

export default function ThankYou({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const history = useHistory();

  React.useEffect(() => {
    // Remove query from url
    history.replace({
      pathname: history.location.pathname,
      hash: history.location.hash,
    });
  }, [history]);

  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Purchase successful</h1>
      <p>Enjoy exploring the 1940s in color!</p>
    </Modal>
  );
}
