import { useCallback, useImperativeHandle, forwardRef, useRef, useEffect, createContext, useContext, useMemo, useState } from "react";
import {
  Tldraw, Editor, AssetRecordType, getSnapshot, loadSnapshot,
  track, useEditor, useValue, TLComponents,
  DefaultImageToolbar, DefaultImageToolbarContent,
  TldrawUiToolbarButton, TldrawUiButtonIcon,
} from "tldraw";
import "tldraw/tldraw.css";

export interface SelectedImageInfo {
  shapeId: string;
  url: string;
  w: number;
  h: number;
  screenBounds: { x: number; y: number; w: number; h: number };
}

export interface ImageToolbarActions {
  onUpscale: (info: SelectedImageInfo, resolution: string) => void;
  onDownload: (info: SelectedImageInfo) => void;
  isUpscaling: boolean;
  is4KEnabled: boolean;
}

export interface BrandCanvasEditorHandle {
  addImage: (imageUrl: string) => void;
  replaceImage: (shapeId: string, newImageUrl: string) => void;
  getSelectedImageUrls: () => string[];
  getSelectedImageInfo: () => SelectedImageInfo[];
  onSelectionChange: (callback: (urls: string[]) => void) => () => void;
}

interface BrandCanvasEditorProps {
  brandId?: string;
  onSelectionChange?: (imageUrls: string[]) => void;
  toolbarActions?: ImageToolbarActions;
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

const ToolbarActionsContext = createContext<ImageToolbarActions | null>(null);

const UpscaleDropdown = track(() => {
  const editor = useEditor();
  const actions = useContext(ToolbarActionsContext);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showMenu]);

  const info = getSelectedImageFromEditor(editor);
  if (!info || !actions) return null;

  const handleSelect = (resolution: string) => {
    setShowMenu(false);
    actions.onUpscale(info, resolution);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex' }}>
      <TldrawUiToolbarButton
        type="icon"
        title="Upscale"
        disabled={actions.isUpscaling}
        onClick={() => setShowMenu(!showMenu)}
      >
        {actions.isUpscaling ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <TldrawUiButtonIcon small icon="zoom-in" />
        )}
      </TldrawUiToolbarButton>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-panel, white)',
            borderRadius: '9px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            minWidth: '130px',
            zIndex: 999,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSelect('2K')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text, #1d1d1d)',
              width: '100%',
              textAlign: 'left',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-muted, #f3f4f6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>Upscale 2K</span>
          </button>
          <button
            onClick={() => handleSelect('4K')}
            disabled={!actions.is4KEnabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              cursor: actions.is4KEnabled ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 500,
              color: actions.is4KEnabled ? 'var(--color-text, #1d1d1d)' : 'var(--color-text-3, #aaa)',
              opacity: actions.is4KEnabled ? 1 : 0.5,
              width: '100%',
              textAlign: 'left',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (actions.is4KEnabled) e.currentTarget.style.background = 'var(--color-muted, #f3f4f6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>Upscale 4K</span>
            {!actions.is4KEnabled && <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 600, marginLeft: 'auto' }}>PRO</span>}
          </button>
        </div>
      )}
    </div>
  );
});

const CustomImageToolbarInner = track(function CustomImageToolbarInner() {
  const editor = useEditor();

  const imageShapeId = useValue(
    "imageShape",
    () => {
      const onlySelectedShape = editor.getOnlySelectedShape();
      if (!onlySelectedShape || onlySelectedShape.type !== "image") return null;
      return onlySelectedShape.id;
    },
    [editor]
  );

  const isInCropTool = useValue("inCrop", () => editor.isIn("select.crop."), [editor]);

  const handleManipulatingStart = useCallback(
    () => editor.setCurrentTool("select.crop.idle"),
    [editor]
  );
  const handleManipulatingEnd = useCallback(() => {
    editor.setCroppingShape(null);
    editor.setCurrentTool("select.idle");
  }, [editor]);

  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const handleEditAltTextStart = useCallback(() => setIsEditingAlt(true), []);

  if (!imageShapeId) return null;

  return (
    <>
      <DefaultImageToolbarContent
        imageShapeId={imageShapeId}
        isManipulating={isInCropTool}
        onEditAltTextStart={handleEditAltTextStart}
        onManipulatingStart={handleManipulatingStart}
        onManipulatingEnd={handleManipulatingEnd}
      />
      <UpscaleDropdown />
    </>
  );
});

const CustomImageToolbar = track(() => {
  return (
    <DefaultImageToolbar>
      <CustomImageToolbarInner />
    </DefaultImageToolbar>
  );
});

const BrandCanvasEditor = forwardRef<BrandCanvasEditorHandle, BrandCanvasEditorProps>(
  ({ brandId, onSelectionChange, toolbarActions }, ref) => {
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
      onSelectionChange: (callback: (urls: string[]) => void) => {
        const editor = editorRef.current;
        if (!editor) return () => {};
        const cleanup = editor.store.listen(() => {
          callback(getSelectedImageUrlsInternal());
        }, { scope: "session" });
        return cleanup;
      },
    }));

    const components: Partial<TLComponents> = useMemo(() => ({
      ImageToolbar: CustomImageToolbar,
    }), []);

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
      <ToolbarActionsContext.Provider value={toolbarActions || null}>
        <Tldraw
          licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
          onMount={handleMount}
          components={components}
        />
      </ToolbarActionsContext.Provider>
    );
  }
);

BrandCanvasEditor.displayName = "BrandCanvasEditor";

export default BrandCanvasEditor;
