import classNames from 'classnames';
import React from 'react';

import stylesheet from './button.less';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isActive?: boolean;
  buttonStyle: 'primary' | 'secondary';
}

export default function Button({
  className,
  isActive,
  buttonStyle,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      {...props}
      className={classNames(
        stylesheet.button,
        { [stylesheet.active]: isActive },
        stylesheet[buttonStyle],
        className
      )}
    />
  );
}
