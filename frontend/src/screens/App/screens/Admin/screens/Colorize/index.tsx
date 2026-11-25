import axios, { HttpStatusCode } from 'axios';
import React from 'react';
import Button from 'shared/components/Button';
import { colorizePhoto } from 'shared/utils/ColorApi';
import stylesheet from './Colorize.less';

const STATUSES_WITH_MESSAGES: number[] = [
  HttpStatusCode.BadRequest,
  HttpStatusCode.NotFound,
];

export default function Colorize(): React.JSX.Element {
  const [identifier, setIdentifier] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleColorize = async (): Promise<void> => {
    if (!identifier) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      window.location.href = await colorizePhoto(identifier);
    } catch (err) {
      console.error('Colorization failed', err);
      const serverMessage =
        axios.isAxiosError<{ error?: string }>(err) &&
        err.response &&
        STATUSES_WITH_MESSAGES.includes(err.response.status)
          ? err.response.data?.error
          : undefined;
      setError(serverMessage ?? 'Colorization failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={stylesheet.container}>
      <h1>Colorize a Photo</h1>
      <input
        type="text"
        placeholder="Photo identifier"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value.trim())}
        disabled={isLoading}
      />
      <Button
        buttonStyle="primary"
        onClick={() => void handleColorize()}
        disabled={!identifier || isLoading}
      >
        {isLoading ? 'Colorizing…' : 'Colorize'}
      </Button>
      {error && <div className={stylesheet.error}>{error}</div>}
    </div>
  );
}
