import classNames from 'classnames';
import React from 'react';

import stylesheet from './textInput.less';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, ...props }, ref): JSX.Element => {
    return (
      <input
        type="text"
        {...props}
        ref={ref}
        className={classNames(stylesheet.input, className)}
      />
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
