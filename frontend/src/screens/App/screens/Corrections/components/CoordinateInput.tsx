import React from 'react';

import { NumericFormat } from 'react-number-format';
import TextInput from 'shared/components/TextInput';

interface CoordinateInputProps {
  name: string;
  label: string;
  placeholder?: number;
  value: number;
  onValueChange: (newValue: number) => void;
  rangeMin: number;
  rangeMax: number;
  className?: string;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({
  name,
  label,
  placeholder,
  value,
  onValueChange,
  rangeMin,
  rangeMax,
  className,
}) => {
  return (
    <NumericFormat
      customInput={TextInput}
      name={name}
      aria-label={label}
      size={11}
      placeholder={
        typeof placeholder === 'number' ? placeholder.toString() : placeholder
      }
      value={value}
      onValueChange={({ floatValue }) => {
        onValueChange(floatValue);
      }}
      decimalScale={6}
      isAllowed={({ floatValue }) =>
        floatValue === undefined ||
        (floatValue >= rangeMin && floatValue <= rangeMax)
      }
      className={className}
    />
  );
};

export default CoordinateInput;
