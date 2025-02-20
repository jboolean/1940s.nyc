import React from 'react';
import ExternalIconSrc from 'shared/assets/external.svg?asset';

import stylesheet from './externalIcon.less';

export default function ExternalIcon(): JSX.Element {
  return (
    <img
      src={ExternalIconSrc}
      alt="External link"
      className={stylesheet.externalIcon}
    />
  );
}
