import classNames from 'classnames';
import React from 'react';

import stylesheet from './textInput.less';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function TextInput({
  className,
  ...props
}: TextInputProps): JSX.Element {
  return (
    <input
      type="text"
      {...props}
      className={classNames(stylesheet.input, className)}
    />
  );
}
