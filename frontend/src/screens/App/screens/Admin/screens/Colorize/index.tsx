import React from 'react';
import Button from 'shared/components/Button';
import TextInput from 'shared/components/TextInput';
import stylesheet from './Colorize.less';
import useColorizeStore from './stores/ColorizeStore';

export default function Colorize(): React.JSX.Element {
  const identifier = useColorizeStore((state) => state.identifier);
  const isLoading = useColorizeStore((state) => state.isLoading);
  const error = useColorizeStore((state) => state.error);
  const setIdentifier = useColorizeStore((state) => state.setIdentifier);
  const colorize = useColorizeStore((state) => state.colorize);

  return (
    <div className={stylesheet.container}>
      <h1>Colorize a Photo</h1>
      <TextInput
        placeholder="Photo identifier"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value.trim())}
        disabled={isLoading}
      />
      <Button
        buttonStyle="primary"
        onClick={() => void colorize()}
        disabled={!identifier || isLoading}
      >
        {isLoading ? 'Colorizing…' : 'Colorize'}
      </Button>
      {error && <div className={stylesheet.error}>{error}</div>}
    </div>
  );
}
