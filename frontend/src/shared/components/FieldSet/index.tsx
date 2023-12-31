import classNames from 'classnames';
import React from 'react';

import stylesheet from './FieldSet.less';

interface FieldSetProps extends React.InputHTMLAttributes<HTMLFieldSetElement> {
  className?: string;
}

interface LegendProps extends React.InputHTMLAttributes<HTMLLegendElement> {}

export function Legend({ className, ...props }: LegendProps): JSX.Element {
  return (
    <legend {...props} className={classNames(stylesheet.legend, className)} />
  );
}

export default function FieldSet({
  className,
  ...props
}: FieldSetProps): JSX.Element {
  return (
    <fieldset
      {...props}
      className={classNames(stylesheet.fieldset, className)}
    />
  );
}

FieldSet.Legend = Legend;
