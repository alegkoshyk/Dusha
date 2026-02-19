import { useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { Tldraw, Editor, AssetRecordType } from "tldraw";
import "tldraw/tldraw.css";

export interface BrandCanvasEditorHandle {
  addImage: (imageUrl: string) => void;
}

const BrandCanvasEditor = forwardRef<BrandCanvasEditorHandle>((_props, ref) => {
  const editorRef = useRef<Editor | null>(null);

  useImperativeHandle(ref, () => ({
    addImage: (imageUrl: string) => {
      const editor = editorRef.current;
      if (!editor) {
        console.error("Editor not ready");
        return;
      }
      const assetId = AssetRecordType.createId();

      editor.createAssets([
        {
          id: assetId,
          type: "image",
          typeName: "asset",
          props: {
            name: "AI Generated",
            src: imageUrl,
            w: 512,
            h: 512,
            mimeType: "image/png",
            isAnimated: false,
          },
          meta: {},
        },
      ]);

      const pageBounds = editor.getViewportPageBounds();
      const centerX = pageBounds.x + pageBounds.w / 2;
      const centerY = pageBounds.y + pageBounds.h / 2;

      editor.createShape({
        type: "image",
        x: centerX - 256,
        y: centerY - 256,
        props: {
          assetId,
          w: 512,
          h: 512,
        },
      });
    },
  }));

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  return (
    <Tldraw
      licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
      onMount={handleMount}
    />
  );
});

BrandCanvasEditor.displayName = "BrandCanvasEditor";

export default BrandCanvasEditor;
