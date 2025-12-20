import { EditorContent, Extension, useEditor } from '@tiptap/react';
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

const ToggleLinkShortcut = Extension.create({
  name: 'toggleLinkShortcut',

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        const { editor } = this;

        // Disable link if is active
        if (editor.isActive('link')) {
          return editor.commands.unsetLink();
        }

        const selectedUrl = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );

        if (selectedUrl) {
          return editor.commands.setLink({
            href: selectedUrl,
            target: '_blank',
          });
        }
        return true;
      },
    };
  },
});

export default function TipTapEditor({
  content,
  className,
  placeholder,
  editable,
  onChange,
}: TipTapEditorProps): JSX.Element {
  const extensions = [
    StarterKit.configure({
      // Only support bold, italics, links
      heading: false,
      bulletList: false,
      orderedList: false,
    }),
    Placeholder.configure({ placeholder }),
    ToggleLinkShortcut,
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
