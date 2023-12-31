import classNames from 'classnames';
import React from 'react';

import useElementId from 'shared/utils/useElementId';
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
  const id = useElementId('labled-input-');

  return (
    <div className={classNames(stylesheet.container, className)}>
      <label htmlFor={id} className={stylesheet.label}>
        {labelText}
      </label>
      <div className={stylesheet.inputWrapper}>{renderInput({ id })}</div>
    </div>
  );
}
