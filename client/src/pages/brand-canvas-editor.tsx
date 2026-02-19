import { useCallback } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";

interface BrandCanvasEditorProps {
  onEditorMount?: (editor: Editor) => void;
}

export default function BrandCanvasEditor({ onEditorMount }: BrandCanvasEditorProps) {
  const handleMount = useCallback((editor: Editor) => {
    onEditorMount?.(editor);
  }, [onEditorMount]);

  return (
    <Tldraw
      licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
      onMount={handleMount}
    />
  );
}
