import uniqueId from 'lodash/uniqueId';
import React from 'react';
import classNames from 'classnames';

import stylesheet from './labeled.less';

export default function Labeled({
  labelText,
  renderInput,
  className,
}: {
  labelText: string;
  renderInput: ({ id }: { id: string }) => JSX.Element;
  className?: string;
}): JSX.Element {
  const idRef = React.useRef<string>(uniqueId('labeled-input-'));
  const id = idRef.current;

  return (
    <div className={classNames(stylesheet.container, className)}>
      <label htmlFor={id} className={stylesheet.label}>
        {labelText}
      </label>
      <div className={stylesheet.inputWrapper}>{renderInput({ id })}</div>
    </div>
  );
}
