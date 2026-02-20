import { useCallback, useImperativeHandle, forwardRef, useRef, useEffect, useMemo } from "react";
import {
  Tldraw, Editor, AssetRecordType, getSnapshot, loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";

export interface SelectedImageInfo {
  shapeId: string;
  url: string;
  w: number;
  h: number;
  screenBounds: { x: number; y: number; w: number; h: number };
}

export interface BrandCanvasEditorHandle {
  addImage: (imageUrl: string) => void;
  replaceImage: (shapeId: string, newImageUrl: string) => void;
  getSelectedImageUrls: () => string[];
  getSelectedImageInfo: () => SelectedImageInfo[];
  getEditor: () => Editor | null;
  onSelectionChange: (callback: (urls: string[]) => void) => () => void;
}

interface BrandCanvasEditorProps {
  brandId?: string;
  onSelectionChange?: (imageUrls: string[]) => void;
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

function getSelectedImageFromEditor(editor: Editor): SelectedImageInfo | null {
  const selectedShapes = editor.getSelectedShapes();
  if (selectedShapes.length !== 1) return null;
  const shape = selectedShapes[0];
  if (shape.type !== "image" || !(shape as any).props?.assetId) return null;
  const asset = editor.getAsset((shape as any).props.assetId);
  if (!asset || asset.type !== "image" || !(asset as any).props?.src) return null;
  const shapeBounds = editor.getShapePageBounds(shape.id);
  if (!shapeBounds) return null;
  const topLeft = editor.pageToScreen({ x: shapeBounds.x, y: shapeBounds.y });
  const bottomRight = editor.pageToScreen({ x: shapeBounds.x + shapeBounds.w, y: shapeBounds.y + shapeBounds.h });
  return {
    shapeId: shape.id,
    url: (asset as any).props.src,
    w: (asset as any).props.w || 0,
    h: (asset as any).props.h || 0,
    screenBounds: {
      x: topLeft.x,
      y: topLeft.y,
      w: bottomRight.x - topLeft.x,
      h: bottomRight.y - topLeft.y,
    },
  };
}

const BrandCanvasEditor = forwardRef<BrandCanvasEditorHandle, BrandCanvasEditorProps>(
  ({ brandId, onSelectionChange }, ref) => {
    const editorRef = useRef<Editor | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialLoadDoneRef = useRef(false);

    const saveToServer = useCallback(async () => {
      const editor = editorRef.current;
      if (!editor || !brandId) return;

      try {
        const snapshot = getSnapshot(editor.store);
        const res = await fetch(`/api/brands/${brandId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ canvasData: snapshot }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.warn("Canvas save failed:", data?.error || res.statusText);
        }
      } catch (e) {
        console.error("Failed to save canvas:", e);
      }
    }, [brandId]);

    const scheduleSave = useCallback(() => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveToServer();
      }, 2000);
    }, [saveToServer]);

    useEffect(() => {
      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        saveToServer();
      };
    }, [saveToServer]);

    const getSelectedImageUrlsInternal = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return [];
      const selectedShapes = editor.getSelectedShapes();
      const urls: string[] = [];
      for (const shape of selectedShapes) {
        if (shape.type === "image" && (shape as any).props?.assetId) {
          const asset = editor.getAsset((shape as any).props.assetId);
          if (asset && asset.type === "image" && (asset as any).props?.src) {
            urls.push((asset as any).props.src);
          }
        }
      }
      return urls;
    }, []);

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
      replaceImage: async (shapeId: string, newImageUrl: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        const shape = editor.getShape(shapeId as any);
        if (!shape || shape.type !== 'image') return;
        
        const { w, h } = await loadImageSize(newImageUrl);
        const newAssetId = AssetRecordType.createId();
        editor.createAssets([{
          id: newAssetId,
          type: "image",
          typeName: "asset",
          props: { name: "Upscaled", src: newImageUrl, w, h, mimeType: "image/png", isAnimated: false },
          meta: {},
        }]);
        
        const oldW = (shape as any).props?.w || w;
        const oldH = (shape as any).props?.h || h;
        editor.updateShape({
          id: shape.id,
          type: 'image',
          props: { assetId: newAssetId, w: oldW, h: oldH },
        });
      },
      getSelectedImageUrls: () => getSelectedImageUrlsInternal(),
      getSelectedImageInfo: (): SelectedImageInfo[] => {
        const editor = editorRef.current;
        if (!editor) return [];
        const info = getSelectedImageFromEditor(editor);
        return info ? [info] : [];
      },
      getEditor: () => editorRef.current,
      onSelectionChange: (callback: (urls: string[]) => void) => {
        const editor = editorRef.current;
        if (!editor) return () => {};
        const cleanup = editor.store.listen(() => {
          callback(getSelectedImageUrlsInternal());
        }, { scope: "session" });
        return cleanup;
      },
    }));

    const handleMount = useCallback(
      (editor: Editor) => {
        editorRef.current = editor;

        if (brandId && !initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          fetch(`/api/brands/${brandId}/canvas`, {
            credentials: "include",
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.canvasData) {
                loadSnapshot(editor.store, data.canvasData);
              }
            })
            .catch((e) => console.error("Failed to load canvas:", e));
        }

        const cleanupSave = editor.store.listen(() => {
          scheduleSave();
        }, { scope: "document" });

        const onSelectionRef = onSelectionChange;
        const cleanupSelection = editor.store.listen(() => {
          if (onSelectionRef) {
            const urls = getSelectedImageUrlsInternal();
            onSelectionRef(urls);
          }
        }, { scope: "session" });

        return () => {
          cleanupSave();
          cleanupSelection();
        };
      },
      [brandId, scheduleSave, onSelectionChange, getSelectedImageUrlsInternal]
    );

    return (
      <Tldraw
        licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
        onMount={handleMount}
      />
    );
  }
);

BrandCanvasEditor.displayName = "BrandCanvasEditor";

export default BrandCanvasEditor;
