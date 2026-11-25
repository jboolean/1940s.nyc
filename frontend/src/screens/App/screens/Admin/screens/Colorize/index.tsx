import axios, { HttpStatusCode } from 'axios';
import React from 'react';
import Button from 'shared/components/Button';
import { colorizeUploadedImage } from 'shared/utils/ColorApi';
import stylesheet from './Colorize.less';

const STATUSES_WITH_MESSAGES: number[] = [
  HttpStatusCode.BadRequest,
  HttpStatusCode.NotFound,
];

export default function Colorize(): React.JSX.Element {
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleColorize = async (): Promise<void> => {
    if (!file) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      window.location.href = await colorizeUploadedImage(file);
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
        type="file"
        accept="image/jpeg,image/png,image/tiff,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={isLoading}
      />
      <Button
        buttonStyle="primary"
        onClick={() => void handleColorize()}
        disabled={!file || isLoading}
      >
        {isLoading ? 'Colorizing…' : 'Colorize'}
      </Button>
      {error && <div className={stylesheet.error}>{error}</div>}
    </div>
  );
}
