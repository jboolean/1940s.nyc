import React from 'react';

import { NumericFormat, NumericFormatProps } from 'react-number-format';

import TextInput from './TextInput';

export default function CurrencyInput({
  ...props
}: NumericFormatProps): JSX.Element {
  return (
    <NumericFormat
      decimalScale={2}
      thousandSeparator
      prefix="$"
      allowNegative={false}
      allowLeadingZeros={false}
      customInput={TextInput}
      {...props}
    />
  );
}
