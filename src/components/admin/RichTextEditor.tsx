/**
 * Editor visual (estilo Wix) para o corpo dos artigos.
 * Gera HTML, que o site já renderiza (marked deixa HTML passar e
 * sanitizeBlogHtml limpa antes de exibir).
 */
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Unlink, Minus, Undo2, Redo2,
  Pilcrow, ImagePlus,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onReady?: (editor: Editor) => void;
  onRequestImage?: () => void;
  onFiles?: (files: File[]) => void;
};

type SlashState = { from: number; to: number; top: number; left: number };

export default function RichTextEditor({ value, onChange, onReady, onRequestImage, onFiles }: Props) {
  // Menu "/" (inserir imagem). O ref deixa o handler de teclado ler o estado atual.
  const [slash, setSlash] = useState<SlashState | null>(null);
  const slashRef = useRef<SlashState | null>(null);
  slashRef.current = slash;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const requestImageRef = useRef(onRequestImage);
  requestImageRef.current = onRequestImage;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "bw-rte__content", "aria-label": "Conteúdo do artigo" },
      handleKeyDown: (view, e) => {
        const st = slashRef.current;
        if (!st) return false;
        if (e.key === "Escape") {
          setSlash(null);
          return true;
        }
        if (e.key === "Enter" && requestImageRef.current) {
          e.preventDefault();
          view.dispatch(view.state.tr.delete(st.from, st.to));
          setSlash(null);
          requestImageRef.current();
          return true;
        }
        return false;
      },
      handlePaste: (_v, e) => {
        const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length || !onFiles) return false;
        e.preventDefault();
        onFiles(files);
        return true;
      },
      handleDrop: (_v, e) => {
        const files = Array.from((e as DragEvent).dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (!files.length || !onFiles) return false;
        e.preventDefault();
        onFiles(files);
        return true;
      },
    },
  });

  // Detecta "/" digitado no começo de um bloco ou depois de espaço.
  useEffect(() => {
    if (!editor) return;
    const check = () => {
      const { selection } = editor.state;
      if (!selection.empty || !requestImageRef.current) return setSlash(null);
      const { $from } = selection;
      if (!$from.parent.isTextblock || $from.parent.type.name === "codeBlock") return setSlash(null);
      const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
      if (!/(^|\s)\/$/.test(before)) return setSlash(null);
      const to = selection.from;
      const coords = editor.view.coordsAtPos(to);
      const box = wrapRef.current?.getBoundingClientRect();
      if (!box) return setSlash(null);
      setSlash({ from: to - 1, to, top: coords.bottom - box.top + 4, left: Math.max(0, coords.left - box.left) });
    };
    editor.on("update", check);
    editor.on("selectionUpdate", check);
    editor.on("blur", () => setSlash(null));
    return () => {
      editor.off("update", check);
      editor.off("selectionUpdate", check);
    };
  }, [editor]);

  const pickImageFromSlash = () => {
    if (!editor || !slash || !onRequestImage) return;
    editor.chain().focus().deleteRange({ from: slash.from, to: slash.to }).run();
    setSlash(null);
    onRequestImage();
  };

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  // Sincroniza quando o valor muda de fora (ex.: post carregado).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const btn = (label: string, active: boolean, onClick: () => void, Icon: typeof Bold) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`bw-rte__btn${active ? " is-active" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon size={16} />
    </button>
  );

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (https://…)", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) return void editor.chain().focus().unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const c = () => editor.chain().focus();

  return (
    <div className="bw-rte" ref={wrapRef}>
      <div className="bw-rte__toolbar" role="toolbar" aria-label="Formatação">
        {btn("Parágrafo", editor.isActive("paragraph"), () => c().setParagraph().run(), Pilcrow)}
        {btn("Título", editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run(), Heading2)}
        {btn("Subtítulo", editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run(), Heading3)}
        <span className="bw-rte__sep" />
        {btn("Negrito", editor.isActive("bold"), () => c().toggleBold().run(), Bold)}
        {btn("Itálico", editor.isActive("italic"), () => c().toggleItalic().run(), Italic)}
        {btn("Sublinhado", editor.isActive("underline"), () => c().toggleUnderline().run(), UIcon)}
        {btn("Tachado", editor.isActive("strike"), () => c().toggleStrike().run(), Strikethrough)}
        <span className="bw-rte__sep" />
        {btn("Lista", editor.isActive("bulletList"), () => c().toggleBulletList().run(), List)}
        {btn("Lista numerada", editor.isActive("orderedList"), () => c().toggleOrderedList().run(), ListOrdered)}
        {btn("Citação", editor.isActive("blockquote"), () => c().toggleBlockquote().run(), Quote)}
        {btn("Linha divisória", false, () => c().setHorizontalRule().run(), Minus)}
        <span className="bw-rte__sep" />
        <span className="bw-rte__sep" />
        {btn("Inserir link", editor.isActive("link"), setLink, LinkIcon)}
        {btn("Remover link", false, () => c().unsetLink().run(), Unlink)}
        {onRequestImage && btn("Inserir imagem", false, onRequestImage, ImagePlus)}
        <span className="bw-rte__sep" />
        {btn("Desfazer", false, () => c().undo().run(), Undo2)}
        {btn("Refazer", false, () => c().redo().run(), Redo2)}
      </div>
      <EditorContent editor={editor} />
      {slash && onRequestImage && (
        <div className="bw-rte__slash" role="menu" aria-label="Inserir bloco" style={{ top: slash.top, left: slash.left }}>
          <button
            type="button"
            role="menuitem"
            className="bw-rte__slash-item"
            onMouseDown={(e) => e.preventDefault()}
            onClick={pickImageFromSlash}
          >
            <ImagePlus size={16} aria-hidden />
            <span>
              <strong>Upload de imagem</strong>
              <small>Escolher do seu computador (Enter)</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
