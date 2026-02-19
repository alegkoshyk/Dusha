import { useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { Tldraw, Editor, AssetRecordType } from "tldraw";
import "tldraw/tldraw.css";

export interface BrandCanvasEditorHandle {
  addImage: (imageUrl: string) => void;
}

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 512, h: 512 });
    img.src = src;
  });
}

const BrandCanvasEditor = forwardRef<BrandCanvasEditorHandle>((_props, ref) => {
  const editorRef = useRef<Editor | null>(null);

  useImperativeHandle(ref, () => ({
    addImage: async (imageUrl: string) => {
      const editor = editorRef.current;
      if (!editor) {
        console.error("Editor not ready");
        return;
      }

      const { w, h } = await loadImageSize(imageUrl);

      const maxSize = 600;
      const scale = Math.min(maxSize / w, maxSize / h, 1);
      const displayW = Math.round(w * scale);
      const displayH = Math.round(h * scale);

      const assetId = AssetRecordType.createId();

      editor.createAssets([
        {
          id: assetId,
          type: "image",
          typeName: "asset",
          props: {
            name: "AI Generated",
            src: imageUrl,
            w,
            h,
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
        x: centerX - displayW / 2,
        y: centerY - displayH / 2,
        props: {
          assetId,
          w: displayW,
          h: displayH,
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
