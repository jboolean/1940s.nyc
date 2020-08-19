import React from 'react';
import Modal from 'components/Modal';

export default function ThankYou({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Thank you!</h1>
      <p>Thank you so much for you helping out!</p>
      <p>
        <em>– Julian</em>
      </p>
    </Modal>
  );
}
