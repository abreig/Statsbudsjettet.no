/**
 * TipTap rik tekst-editor.
 * WCAG 2.1 AA-kompatibel med tastaturnavigasjon og aria-labels.
 */

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect } from "react";

interface TipTapEditorProps {
  value: unknown | null;
  onChange: (json: unknown) => void;
  placeholder?: string;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = "Skriv her...",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          loading: "lazy",
        },
      }),
    ],
    content: value ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "tiptap-innhold",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": placeholder,
      },
    },
  });

  // Synkroniser ekstern verdi
  useEffect(() => {
    if (editor && value && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const settLenke = useCallback(() => {
    if (!editor) return;
    const url = prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-verktøylinje" role="toolbar" aria-label="Tekstformatering">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "aktiv" : ""}
          aria-label="Overskrift nivå 2"
          aria-pressed={editor.isActive("heading", { level: 2 })}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "aktiv" : ""}
          aria-label="Overskrift nivå 3"
          aria-pressed={editor.isActive("heading", { level: 3 })}
        >
          H3
        </button>
        <span className="tiptap-separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "aktiv" : ""}
          aria-label="Fet skrift"
          aria-pressed={editor.isActive("bold")}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "aktiv" : ""}
          aria-label="Kursiv"
          aria-pressed={editor.isActive("italic")}
        >
          <em>I</em>
        </button>
        <span className="tiptap-separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "aktiv" : ""}
          aria-label="Punktliste"
          aria-pressed={editor.isActive("bulletList")}
        >
          • Liste
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "aktiv" : ""}
          aria-label="Nummerert liste"
          aria-pressed={editor.isActive("orderedList")}
        >
          1. Liste
        </button>
        <span className="tiptap-separator" />
        <button
          type="button"
          onClick={settLenke}
          className={editor.isActive("link") ? "aktiv" : ""}
          aria-label="Sett inn lenke"
          aria-pressed={editor.isActive("link")}
        >
          Lenke
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            aria-label="Fjern lenke"
          >
            Fjern lenke
          </button>
        )}
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .tiptap-wrapper {
          border: 1px solid #ccc;
          border-radius: 6px;
          overflow: hidden;
        }
        .tiptap-verktøylinje {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding: 0.5rem;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
        }
        .tiptap-verktøylinje button {
          padding: 0.25rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 4px;
          background: none;
          cursor: pointer;
          font-size: 0.8125rem;
          font-family: inherit;
          color: #333;
        }
        .tiptap-verktøylinje button:hover {
          background: #e9ecef;
        }
        .tiptap-verktøylinje button.aktiv {
          background: var(--reg-blaa, #4156A6);
          color: #fff;
          border-color: var(--reg-blaa, #4156A6);
        }
        .tiptap-verktøylinje button:focus-visible {
          outline: 2px solid var(--reg-blaa, #4156A6);
          outline-offset: 1px;
        }
        .tiptap-separator {
          width: 1px;
          background: #ddd;
          margin: 0 0.25rem;
          align-self: stretch;
        }
        .tiptap-innhold {
          padding: 1rem;
          min-height: 150px;
          outline: none;
        }
        .tiptap-innhold:focus {
          box-shadow: inset 0 0 0 2px rgba(65, 86, 166, 0.15);
        }
        .tiptap-innhold h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap-innhold h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
        .tiptap-innhold p { margin: 0.5rem 0; }
        .tiptap-innhold ul, .tiptap-innhold ol { padding-left: 1.5rem; }
        .tiptap-innhold a { color: var(--reg-blaa, #4156A6); }
        .tiptap-innhold img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
