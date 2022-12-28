import classNames from 'classnames';
import React from 'react';

import stylesheet from './button.less';

type ButtonStyleProps = {
  className?: string;
  isActive?: boolean;
  buttonStyle: 'primary' | 'secondary';
  buttonTheme?: 'modal' | 'viewer';
};

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {}

interface ButtonStyledLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ButtonStyleProps {}

export default function Button({
  className,
  isActive,
  buttonStyle,
  buttonTheme = 'modal',
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
        stylesheet[buttonTheme],
        className
      )}
    />
  );
}

export function ButtonStyledLink({
  className,
  isActive,
  buttonStyle,
  buttonTheme = 'modal',
  ...props
}: ButtonStyledLinkProps): JSX.Element {
  return (
    <a
      {...props}
      className={classNames(
        stylesheet.button,
        { [stylesheet.active]: isActive },
        stylesheet[buttonStyle],
        stylesheet[buttonTheme],
        className
      )}
    />
  );
}
