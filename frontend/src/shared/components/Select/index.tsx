import classNames from 'classnames';
import React from 'react';

import stylesheet from './select.less';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref): React.JSX.Element => {
    return (
      <select
        {...props}
        ref={ref}
        className={classNames(stylesheet.select, className)}
      />
    );
  }
);

Select.displayName = 'Select';

export default Select;
