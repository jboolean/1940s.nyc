import React, { ChangeEventHandler } from 'react';

export default function TextContent({
  textContent,
  onTextContentChange,
  onSubmit,
  isSubmitting,
  isValidToSave,
}: {
  textContent: string;
  onTextContentChange: (newTextContent: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValidToSave: boolean;
}): JSX.Element {
  const handleTextContentChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    onTextContentChange(event.target.value);
  };

  return (
    <div>
      <textarea value={textContent ?? ''} onChange={handleTextContentChange} />
      <button onClick={onSubmit} disabled={isSubmitting || !isValidToSave}>
        Save & Continue
      </button>
    </div>
  );
}
