import classNames from 'classnames';
import React from 'react';

import stylesheet from './checkbox.less';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref): React.JSX.Element => {
    return (
      <input
        {...props}
        type="checkbox"
        ref={ref}
        className={classNames(stylesheet.checkbox, className)}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
