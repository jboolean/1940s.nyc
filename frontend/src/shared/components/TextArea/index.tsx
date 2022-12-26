import classNames from 'classnames';
import React from 'react';

import stylesheet from './textarea.less';

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={classNames(stylesheet.textarea, className)}
      />
    );
  }
);

export default TextArea;
