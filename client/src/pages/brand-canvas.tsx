import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, MessageCircle, Send, X, Bot, User, Image, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequestJson } from "@/lib/queryClient";
import type { GameSession } from "@shared/schema";
import type { BrandCanvasEditorHandle } from "./brand-canvas-editor";

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

export default function BrandCanvas() {
  const { brandId } = useParams<{ brandId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<BrandCanvasEditorHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: brand } = useQuery<{ id: string; name: string }>({
    queryKey: ["/api/brands", brandId],
    enabled: !!brandId,
  });

  const { data: allSessions = [] } = useQuery<GameSession[]>({
    queryKey: ["/api/user/game-sessions"],
    enabled: !!user,
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    mutationFn: async (prompt: string) => {
      return apiRequestJson(
        "POST",
        `/api/game-sessions/${activeSessionId}/generate-image`,
        { prompt, aspectRatio: "1:1" }
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/game-sessions", activeSessionId, "chat"],
      });
      if (data?.imageUrl) {
        canvasRef.current?.addImage(data.imageUrl);
      }
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !activeSessionId) return;

    if (
      trimmed.toLowerCase().startsWith("/img ") ||
      trimmed.toLowerCase().startsWith("/image ")
    ) {
      const prompt = trimmed.replace(/^\/(img|image)\s+/i, "");
      if (prompt) {
        generateImageMutation.mutate(prompt);
      }
    } else {
      sendMutation.mutate(trimmed);
    }
    setMessage("");
  };

  const isSending = sendMutation.isPending || generateImageMutation.isPending;

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
            <TldrawEditor ref={canvasRef} />
          </Suspense>
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
                      <div className="bg-muted rounded-2xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-muted-foreground">
                            {generateImageMutation.isPending
                              ? "Генерую зображення..."
                              : "Думаю..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t">
                  <div className="flex gap-2">
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
                      placeholder="/img опис або текст..."
                      disabled={isSending}
                      className="text-sm h-9"
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={handleSend}
                      disabled={isSending || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    <code className="bg-muted px-1 rounded">/img</code> — генерація зображення на полотно
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
