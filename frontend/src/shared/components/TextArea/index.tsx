import classNames from 'classnames';
import React from 'react';

import stylesheet from './textarea.less';

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export default function TextArea({
  className,
  ...props
}: TextAreaProps): JSX.Element {
  return (
    <textarea
      {...props}
      className={classNames(stylesheet.textarea, className)}
    />
  );
}
