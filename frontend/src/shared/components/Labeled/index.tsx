import uniqueId from 'lodash/uniqueId';
import React from 'react';

import stylesheet from './labeled.less';

export default function Labeled({
  labelText,
  renderInput,
}: {
  labelText: string;
  renderInput: ({ id }: { id: string }) => JSX.Element;
}): JSX.Element {
  const id = uniqueId('labeled-input-');

  return (
    <div className={stylesheet.container}>
      <label htmlFor={id} className={stylesheet.label}>
        {labelText}
      </label>
      <div className={stylesheet.inputWrapper}>{renderInput({ id })}</div>
    </div>
  );
}
