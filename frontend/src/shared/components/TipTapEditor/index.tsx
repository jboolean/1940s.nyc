import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

import stylesheet from './tiptapEditor.less';
import classNames from 'classnames';

interface TipTapEditorProps {
  content: string;
  className?: string;
  placeholder?: string;
  editable?: boolean;
  onChange?: (newContent: string) => void;
}

export default function TipTapEditor({
  content,
  className,
  placeholder,
  editable,
  onChange,
}: TipTapEditorProps): JSX.Element {
  const extensions = [
    Markdown,
    StarterKit,
    Placeholder.configure({ placeholder }),
  ];

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: classNames(stylesheet.tiptap, className),
      },
    },
  });

  return <EditorContent className={className} editor={editor} />;
}
