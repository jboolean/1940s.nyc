import React from 'react';
import uniqueId from 'lodash/uniqueId';

export default function useElementId(prefix: string): string {
  const idRef = React.useRef<string>(uniqueId(prefix));
  const id = idRef.current;
  return id;
}
