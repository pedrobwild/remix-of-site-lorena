/**
 * Editor visual (estilo Wix) para o corpo dos artigos.
 * Gera HTML, que o site já renderiza (marked deixa HTML passar e
 * sanitizeBlogHtml limpa antes de exibir).
 */
import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Unlink, AlignLeft, AlignCenter, AlignRight, Minus, Undo2, Redo2,
  Pilcrow, ImagePlus,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onReady?: (editor: Editor) => void;
  onRequestImage?: () => void;
  onFiles?: (files: File[]) => void;
};

export default function RichTextEditor({ value, onChange, onReady, onRequestImage, onFiles }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "bw-rte__content", "aria-label": "Conteúdo do artigo" },
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
    <div className="bw-rte">
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
        {btn("Alinhar à esquerda", editor.isActive({ textAlign: "left" }), () => c().setTextAlign("left").run(), AlignLeft)}
        {btn("Centralizar", editor.isActive({ textAlign: "center" }), () => c().setTextAlign("center").run(), AlignCenter)}
        {btn("Alinhar à direita", editor.isActive({ textAlign: "right" }), () => c().setTextAlign("right").run(), AlignRight)}
        <span className="bw-rte__sep" />
        {btn("Inserir link", editor.isActive("link"), setLink, LinkIcon)}
        {btn("Remover link", false, () => c().unsetLink().run(), Unlink)}
        {onRequestImage && btn("Inserir imagem", false, onRequestImage, ImagePlus)}
        <span className="bw-rte__sep" />
        {btn("Desfazer", false, () => c().undo().run(), Undo2)}
        {btn("Refazer", false, () => c().redo().run(), Redo2)}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
