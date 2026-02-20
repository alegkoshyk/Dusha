import { Suspense, lazy, useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Loader2, MessageCircle, Send, X, Bot, User, ImagePlus,
  Image, Sparkles, Settings2, ShoppingBag, Palette, ChevronDown, ChevronUp,
  Maximize2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequestJson } from "@/lib/queryClient";
import { resolveMediaUrl } from "@/lib/utils";
import type { GameSession, GenerationTemplate, MerchType } from "@shared/schema";
import type { BrandCanvasEditorHandle, SelectedImageInfo } from "./brand-canvas-editor";

const TldrawEditor = lazy(() => import("./brand-canvas-editor"));

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant" | "system" | "image";
  content: string;
  imageUrl?: string | null;
  metadata?: any;
  createdAt: string;
}

interface BrandData {
  id: string;
  name: string;
  logo?: string | null;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

function CanvasImageSkeleton() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const estimatedTotal = 25;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  const progress = Math.min(95, Math.round((elapsed / estimatedTotal) * 100));
  const phase = elapsed < 5 ? 'Підготовка...' 
    : elapsed < 12 ? 'Генерація...' 
    : elapsed < 20 ? 'Обробка...' 
    : 'Майже готово...';
  
  return (
    <div className="space-y-1.5">
      <div className="relative w-36 h-36 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
            <span className="text-xl font-bold text-gray-500 dark:text-gray-300">{progress}%</span>
          </div>
        </div>
      </div>
      <div className="w-36">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{phase}</p>
      </div>
    </div>
  );
}

function UpscaleOverlay({ canvasRef, shapeId }: { canvasRef: React.RefObject<BrandCanvasEditorHandle>; shapeId: string }) {
  const [bounds, setBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const update = () => {
      const editor = canvasRef.current?.getEditor?.();
      if (!editor) return;
      const shape = editor.getShape(shapeId as any);
      if (!shape) return;
      const pageBounds = editor.getShapePageBounds(shape.id);
      if (!pageBounds) return;
      const topLeft = editor.pageToScreen({ x: pageBounds.x, y: pageBounds.y });
      const bottomRight = editor.pageToScreen({ x: pageBounds.x + pageBounds.w, y: pageBounds.y + pageBounds.h });
      setBounds({
        x: topLeft.x,
        y: topLeft.y,
        w: bottomRight.x - topLeft.x,
        h: bottomRight.y - topLeft.y,
      });
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [canvasRef, shapeId]);

  if (!bounds) return null;

  const progress = Math.min(95, Math.round((elapsed / 25) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40 rounded-lg backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-white text-sm font-medium drop-shadow-lg">Upscale {progress}%</span>
        <span className="text-white/60 text-[11px] drop-shadow">{elapsed}с</span>
      </div>
    </div>
  );
}

export default function BrandCanvas() {
  const { brandId } = useParams<{ brandId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useLogo, setUseLogo] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [useNanoBananaPro, setUseNanoBananaPro] = useState(false);
  const [nanoBananaResolution, setNanoBananaResolution] = useState('standard');
  const [selectedMerchTypeId, setSelectedMerchTypeId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [showMerchPicker, setShowMerchPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedCanvasImages, setSelectedCanvasImages] = useState<string[]>([]);
  const [selectedImageInfo, setSelectedImageInfo] = useState<SelectedImageInfo[]>([]);
  const canvasRef = useRef<BrandCanvasEditorHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCanvasSelectionChange = useCallback((urls: string[]) => {
    setSelectedCanvasImages(urls);
    const infos = canvasRef.current?.getSelectedImageInfo() || [];
    setSelectedImageInfo(infos);
    if (infos.length !== 1) {
      setShowUpscaleMenu(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const infos = canvasRef.current?.getSelectedImageInfo() || [];
      setSelectedImageInfo(prev => {
        if (prev.length !== infos.length) return infos;
        if (infos.length === 1 && prev.length === 1 && prev[0].shapeId !== infos[0].shapeId) return infos;
        return prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { data: brand } = useQuery<BrandData>({
    queryKey: ["/api/user/brands", brandId],
    enabled: !!brandId,
  });

  const { data: allSessions = [] } = useQuery<GameSession[]>({
    queryKey: ["/api/user/game-sessions"],
    enabled: !!user,
  });

  const { data: merchTypes = [] } = useQuery<MerchType[]>({
    queryKey: ["/api/merch-types"],
    enabled: chatOpen,
  });

  const { data: generationTemplates = [] } = useQuery<GenerationTemplate[]>({
    queryKey: ["/api/generation-templates"],
    enabled: chatOpen,
  });

  const brandSessions = brandId
    ? allSessions.filter((s) => s.brandId === brandId)
    : [];
  const activeSession =
    brandSessions.find((s) => !s.completed) ||
    brandSessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  const activeSessionId = activeSession?.id;

  const { data: messages = [], isLoading: messagesLoading } = useQuery<
    ChatMessage[]
  >({
    queryKey: ["/api/game-sessions", activeSessionId, "chat"],
    enabled: !!activeSessionId && chatOpen,
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      return apiRequestJson(
        "POST",
        `/api/game-sessions/${activeSessionId}/chat`,
        { message: msg }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/game-sessions", activeSessionId, "chat"],
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (params: {
      prompt?: string;
      aspectRatio: string;
      logoUrl?: string;
      templateId?: number;
      merchTypeId?: number;
      referenceUrls?: string[];
      usePro?: boolean;
      resolution?: string;
    }) => {
      return apiRequestJson(
        "POST",
        `/api/game-sessions/${activeSessionId}/generate-image`,
        params
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/game-sessions", activeSessionId, "chat"],
      });
      const imageData = data?.imageBase64 || data?.imageUrl;
      if (imageData) {
        canvasRef.current?.addImage(imageData);
      }
    },
  });

  useEffect(() => {
    if (sendMutation.isPending || generateImageMutation.isPending) {
      scrollToBottom();
    }
  }, [sendMutation.isPending, generateImageMutation.isPending, scrollToBottom]);

  const upscaleShapeIdRef = useRef<string | null>(null);

  const upscaleMutation = useMutation({
    mutationFn: async (params: { imageUrl: string; resolution: string; aspectRatio: string; usePro: boolean }) => {
      return apiRequestJson("POST", `/api/game-sessions/${activeSessionId}/upscale-image`, params);
    },
    onSuccess: (data: any) => {
      const imageUrl = data?.imageUrl;
      if (imageUrl && upscaleShapeIdRef.current) {
        canvasRef.current?.replaceImage(upscaleShapeIdRef.current, imageUrl);
      }
      upscaleShapeIdRef.current = null;
    },
    onError: () => {
      upscaleShapeIdRef.current = null;
    },
  });

  const getImageAspectRatio = useCallback((w: number, h: number): string => {
    const ratio = w / h;
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 4/3) < 0.15) return '4:3';
    if (Math.abs(ratio - 3/4) < 0.15) return '3:4';
    if (Math.abs(ratio - 16/9) < 0.2) return '16:9';
    if (Math.abs(ratio - 9/16) < 0.2) return '9:16';
    return ratio > 1 ? '16:9' : '9:16';
  }, []);

  const [showUpscaleMenu, setShowUpscaleMenu] = useState(false);
  const [upscaleMenuPos, setUpscaleMenuPos] = useState<{ top: number; left: number } | null>(null);
  const upscaleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const UPSCALE_BTN_ID = 'upscale-injected-btn';
    const UPSCALE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

    const interval = setInterval(() => {
      const toolbar = document.querySelector('.tlui-image__toolbar');
      if (!toolbar) {
        const existing = document.getElementById(UPSCALE_BTN_ID);
        if (existing) existing.remove();
        return;
      }

      const infos = canvasRef.current?.getSelectedImageInfo() || [];
      let btn = document.getElementById(UPSCALE_BTN_ID) as HTMLButtonElement | null;

      if (infos.length === 1 && !upscaleMutation.isPending) {
        if (!btn) {
          btn = document.createElement('button');
          btn.id = UPSCALE_BTN_ID;
          btn.className = 'tlui-button tlui-button__icon';
          btn.title = 'Upscale';
          btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:32px;height:32px;cursor:pointer;';
          btn.innerHTML = UPSCALE_SVG;
          btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
          });
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = btn!.getBoundingClientRect();
            setUpscaleMenuPos({ top: rect.bottom + 6, left: rect.left });
            setShowUpscaleMenu(prev => !prev);
          });
          const altBtn = toolbar.querySelector('[data-testid="tool.image-alt-text"]');
          if (altBtn) {
            altBtn.parentNode?.insertBefore(btn, altBtn);
          } else {
            toolbar.appendChild(btn);
          }
        }
      } else {
        btn?.remove();
        setShowUpscaleMenu(false);
      }
    }, 200);

    return () => {
      clearInterval(interval);
      document.getElementById(UPSCALE_BTN_ID)?.remove();
    };
  }, [upscaleMutation.isPending]);
  const handleUpscale = useCallback((resolution: string) => {
    if (!activeSessionId) return;
    const infos = canvasRef.current?.getSelectedImageInfo() || [];
    if (infos.length !== 1) return;
    const info = infos[0];
    upscaleShapeIdRef.current = info.shapeId;
    setShowUpscaleMenu(false);
    const ar = getImageAspectRatio(info.w, info.h);
    upscaleMutation.mutate({
      imageUrl: info.url,
      resolution,
      aspectRatio: ar,
      usePro: useNanoBananaPro,
    });
  }, [activeSessionId, upscaleMutation, useNanoBananaPro, getImageAspectRatio]);

  useEffect(() => {
    if (!showUpscaleMenu) return;
    const handler = (e: PointerEvent) => {
      const injectedBtn = document.getElementById('upscale-injected-btn');
      if (
        upscaleMenuRef.current && !upscaleMenuRef.current.contains(e.target as Node) &&
        (!injectedBtn || !injectedBtn.contains(e.target as Node))
      ) {
        setShowUpscaleMenu(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showUpscaleMenu]);

  const getTargetDimensions = useCallback((w: number, h: number, resolution: string) => {
    const maxDim = resolution === '4K' ? 4096 : 2048;
    const scale = maxDim / Math.max(w, h);
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
  }, []);

  const willGenerateImage = useLogo && brand?.logo || selectedMerchTypeId || selectedTemplateId || selectedCanvasImages.length > 0;

  const handleSend = () => {
    const trimmed = message.trim();
    if (!activeSessionId) return;

    const isImageCommand =
      trimmed.toLowerCase().startsWith("/img ") ||
      trimmed.toLowerCase().startsWith("/image ");

    const logoUrlParam = useLogo && brand?.logo ? resolveMediaUrl(brand.logo) : undefined;
    const refUrls = selectedCanvasImages.length > 0 ? selectedCanvasImages : undefined;

    if (selectedMerchTypeId || selectedTemplateId) {
      generateImageMutation.mutate({
        prompt: trimmed || undefined,
        aspectRatio,
        logoUrl: logoUrlParam,
        templateId: selectedTemplateId || undefined,
        merchTypeId: selectedMerchTypeId || undefined,
        referenceUrls: refUrls,
        usePro: useNanoBananaPro,
        resolution: nanoBananaResolution,
      });
      setSelectedMerchTypeId(null);
      setSelectedTemplateId(null);
    } else if (useLogo && brand?.logo) {
      generateImageMutation.mutate({
        prompt: trimmed || 'Generate a branded image with this logo',
        aspectRatio,
        logoUrl: logoUrlParam,
        referenceUrls: refUrls,
        usePro: useNanoBananaPro,
        resolution: nanoBananaResolution,
      });
    } else if (isImageCommand) {
      const prompt = trimmed.replace(/^\/(img|image)\s+/i, "");
      if (prompt) {
        generateImageMutation.mutate({
          prompt,
          aspectRatio,
          logoUrl: logoUrlParam,
          referenceUrls: refUrls,
          usePro: useNanoBananaPro,
          resolution: nanoBananaResolution,
        });
      }
    } else if (refUrls && trimmed) {
      generateImageMutation.mutate({
        prompt: trimmed,
        aspectRatio,
        logoUrl: logoUrlParam,
        referenceUrls: refUrls,
        usePro: useNanoBananaPro,
        resolution: nanoBananaResolution,
      });
    } else if (trimmed) {
      sendMutation.mutate(trimmed);
    }
    setMessage("");
  };

  const handleQuickMerch = (merchId: number) => {
    setSelectedMerchTypeId(merchId);
    setShowMerchPicker(false);
    setShowTemplatePicker(false);
    setSelectedTemplateId(null);
    if (brand?.logo) {
      setUseLogo(true);
    }
  };

  const handleQuickTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setShowTemplatePicker(false);
    setShowMerchPicker(false);
    setSelectedMerchTypeId(null);
  };

  const isSending = sendMutation.isPending || generateImageMutation.isPending;
  const selectedMerch = merchTypes.find((m) => m.id === selectedMerchTypeId);
  const selectedTemplate = generationTemplates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <Link href={`/brand/${brandId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-sm font-medium truncate flex-1">
          {brand?.name ? `${brand.name} — Полотно` : "Полотно"}
        </h1>
        <Button
          variant={chatOpen ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">AI Чат</span>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <TldrawEditor ref={canvasRef} brandId={brandId} onSelectionChange={handleCanvasSelectionChange} />
          </Suspense>

          {showUpscaleMenu && upscaleMenuPos && selectedImageInfo.length === 1 && (() => {
            const info = selectedImageInfo[0];
            const target2K = getTargetDimensions(info.w, info.h, '2K');
            const target4K = getTargetDimensions(info.w, info.h, '4K');
            return (
              <div
                ref={upscaleMenuRef}
                style={{
                  position: 'fixed',
                  top: upscaleMenuPos.top,
                  left: upscaleMenuPos.left,
                  zIndex: 99999,
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 min-w-[220px]"
              >
                <div className="px-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                  Поточний: {info.w}×{info.h}px
                </div>
                <button
                  onClick={() => handleUpscale('2K')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Maximize2 className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Upscale 2K</div>
                    <div className="text-[11px] text-gray-400">{target2K.w}×{target2K.h}px</div>
                  </div>
                </button>
                <button
                  onClick={() => handleUpscale('4K')}
                  disabled={!useNanoBananaPro}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors text-left ${useNanoBananaPro ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <Maximize2 className="h-4 w-4 text-purple-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Upscale 4K</div>
                    <div className="text-[11px] text-gray-400">{target4K.w}×{target4K.h}px</div>
                  </div>
                  {!useNanoBananaPro && (
                    <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">PRO</span>
                  )}
                </button>
              </div>
            );
          })()}

          {upscaleMutation.isPending && upscaleShapeIdRef.current && <UpscaleOverlay canvasRef={canvasRef} shapeId={upscaleShapeIdRef.current} />}
        </div>

        {chatOpen && (
          <div className="w-80 lg:w-96 border-l flex flex-col bg-background shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI Асистент</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!activeSessionId ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <div className="space-y-2">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Щоб використовувати AI чат, спочатку пройдіть гру для цього
                    бренду
                  </p>
                  <Link href={`/brand-chat/brand/${brandId}`}>
                    <Button variant="outline" size="sm" className="mt-2">
                      Відкрити чат
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messagesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Bot className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Напишіть повідомлення або
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <code className="bg-muted px-1.5 py-0.5 rounded">/img опис</code> — згенерувати зображення
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role !== "user" && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : msg.role === "image"
                              ? "bg-muted/50 p-1"
                              : "bg-muted"
                          }`}
                        >
                          {msg.role === "image" && msg.imageUrl ? (
                            <div className="space-y-1">
                              <img
                                src={msg.imageUrl}
                                alt={msg.content}
                                className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => canvasRef.current?.addImage(msg.imageUrl!)}
                                title="Натисніть, щоб додати на полотно"
                              />
                              <div className="flex items-center gap-1 px-2 py-1">
                                <Image className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {msg.content}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </span>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      {generateImageMutation.isPending ? (
                        <CanvasImageSkeleton />
                      ) : (
                        <div className="bg-muted rounded-2xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs text-muted-foreground">Думаю...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t">
                  {settingsOpen && (
                    <div className="p-3 space-y-3 border-b bg-muted/30 max-h-[50vh] overflow-y-auto">
                      {brand?.logo && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={resolveMediaUrl(brand.logo)}
                              alt="Logo"
                              className="w-8 h-8 rounded object-contain bg-muted p-0.5"
                            />
                            <Label htmlFor="canvas-use-logo" className="text-xs">
                              Логотип
                            </Label>
                          </div>
                          <Switch
                            id="canvas-use-logo"
                            checked={useLogo}
                            onCheckedChange={setUseLogo}
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Надналаштування</span>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">🍌 Pro модель</span>
                          <Switch id="canvas-use-pro" checked={useNanoBananaPro} onCheckedChange={(v) => { setUseNanoBananaPro(v); if (!v && nanoBananaResolution === '4K') setNanoBananaResolution('2K'); }} className="scale-[0.65]" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">🖼️ Якість</span>
                          <div className="flex items-center gap-0.5">
                            {[
                              { value: 'standard', label: 'Стд' },
                              { value: '2K', label: '2K' },
                              { value: '4K', label: '4K', requiresPro: true },
                            ].map((r) => {
                              const disabled = (r as any).requiresPro && !useNanoBananaPro;
                              return (
                                <button
                                  key={r.value}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setNanoBananaResolution(r.value)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    disabled
                                      ? 'bg-muted text-muted-foreground/40 cursor-not-allowed opacity-50'
                                      : nanoBananaResolution === r.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }`}
                                  title={disabled ? 'Потрібна Pro модель' : undefined}
                                >
                                  {r.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Пропорції</Label>
                        <div className="flex gap-1 flex-wrap">
                          {ASPECT_RATIOS.map((ar) => (
                            <button
                              key={ar.value}
                              type="button"
                              onClick={() => setAspectRatio(ar.value)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                aspectRatio === ar.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
                              }`}
                            >
                              {ar.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {merchTypes.length > 0 && (
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
                            onClick={() => {
                              setShowMerchPicker(!showMerchPicker);
                              setShowTemplatePicker(false);
                            }}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            Мерч
                            {showMerchPicker ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          {showMerchPicker && (
                            <div className="grid grid-cols-2 gap-1">
                              {merchTypes.map((mt) => (
                                  <button
                                    key={mt.id}
                                    type="button"
                                    onClick={() => handleQuickMerch(mt.id)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors text-left ${
                                      selectedMerchTypeId === mt.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                    }`}
                                  >
                                    <span>{mt.emoji}</span>
                                    <span className="truncate">{mt.name}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {generationTemplates.length > 0 && (
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
                            onClick={() => {
                              setShowTemplatePicker(!showTemplatePicker);
                              setShowMerchPicker(false);
                            }}
                          >
                            <Palette className="h-3 w-3" />
                            Шаблони
                            {showTemplatePicker ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          {showTemplatePicker && (
                            <div className="grid grid-cols-2 gap-1">
                              {generationTemplates.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleQuickTemplate(t.id)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors text-left ${
                                      selectedTemplateId === t.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                    }`}
                                  >
                                    {t.referenceImageUrl && (
                                      <img
                                        src={resolveMediaUrl(t.referenceImageUrl)}
                                        alt=""
                                        className="w-6 h-6 rounded object-cover shrink-0"
                                      />
                                    )}
                                    <span className="truncate">{t.name}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedMerch || selectedTemplate || (useLogo && brand?.logo) || selectedCanvasImages.length > 0) && (
                    <div className="px-3 pt-2 flex items-center gap-2 flex-wrap">
                      {selectedMerch && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>{selectedMerch.emoji}</span>
                          {selectedMerch.name}
                          <button
                            type="button"
                            onClick={() => setSelectedMerchTypeId(null)}
                            className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {selectedTemplate && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          {selectedTemplate.name}
                          <button
                            type="button"
                            onClick={() => setSelectedTemplateId(null)}
                            className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {useLogo && brand?.logo && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <img src={resolveMediaUrl(brand.logo)} alt="" className="w-4 h-4 rounded" />
                          лого
                        </span>
                      )}
                      {selectedCanvasImages.length > 0 && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          {selectedCanvasImages.length} реф.
                          {selectedCanvasImages.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-4 h-4 rounded object-cover" />
                          ))}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3">
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 shrink-0 ${settingsOpen ? "bg-muted" : ""}`}
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        title="Налаштування генерації"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Input
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={
                          selectedMerch
                            ? `${selectedMerch.emoji} Стиль/опис мерчу...`
                            : selectedTemplate
                            ? "Додатковий опис..."
                            : selectedCanvasImages.length > 0
                            ? `Опис генерації (${selectedCanvasImages.length} реф.)...`
                            : useLogo && brand?.logo
                            ? "Опишіть що згенерувати з лого..."
                            : "/img опис або текст..."
                        }
                        disabled={isSending}
                        className="text-sm h-9"
                      />
                      <Button
                        size="icon"
                        className={`h-9 w-9 shrink-0 ${willGenerateImage ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white' : ''}`}
                        onClick={handleSend}
                        disabled={
                          isSending ||
                          (!message.trim() && !selectedMerchTypeId && !selectedTemplateId && !willGenerateImage)
                        }
                      >
                        {willGenerateImage ? <ImagePlus className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    {!willGenerateImage && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        <code className="bg-muted px-1 rounded">/img</code> — генерація зображення на полотно
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
