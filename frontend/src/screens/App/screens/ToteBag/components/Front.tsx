import React from 'react';

import classNames from 'classnames';

import stylesheet from '../ToteBag.less';

export type Color = 'green' | 'red' | 'creme' | 'dark';

export default function Front({
  foregroundColor = 'creme',
  backgroundColor = 'green',
  style = 'outline',
}: {
  foregroundColor?: Color;
  backgroundColor?: Color;
  style?: 'outline' | 'solid';
}): JSX.Element {
  return (
    <div
      className={classNames(
        stylesheet.front,
        stylesheet[`background-${backgroundColor}`],
        stylesheet[`foreground-${foregroundColor}`],
        stylesheet[`style-${style}`]
      )}
    >
      <h1 className={stylesheet.logo}>1940s.nyc</h1>
    </div>
  );
}
