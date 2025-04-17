import React from 'react';

import classNames from 'classnames';

import stylesheet from './TextButton.less';

export default function TextButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(stylesheet.textButton, className)}
    >
      {children}
    </button>
  );
}
