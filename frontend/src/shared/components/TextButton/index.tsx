import React from 'react';

import classNames from 'classnames';

import stylesheet from './TextButton.less';

export default function TextButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(stylesheet.textButton, className)}
    >
      {children}
    </button>
  );
}
