import { Bold, Italic, List } from "lucide-react";
import { useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null);

  function execute(command: string): void {
    document.execCommand(command);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="richText">
      <div className="editorToolbar">
        <button type="button" onClick={() => execute("bold")} title="Negrita"><Bold size={16} /></button>
        <button type="button" onClick={() => execute("italic")} title="Cursiva"><Italic size={16} /></button>
        <button type="button" onClick={() => execute("insertUnorderedList")} title="Lista"><List size={16} /></button>
      </div>
      <div
        ref={editorRef}
        className="editorSurface"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
      />
    </div>
  );
}
