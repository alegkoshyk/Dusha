import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  ArrowLeft, 
  Trash2, 
  Bot, 
  User,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';
import type { GameSession, UserBrand } from '@shared/schema';

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export default function BrandChat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ['/api/game-sessions', sessionId],
    enabled: !!sessionId && !!user,
  });

  const { data: brand } = useQuery<UserBrand>({
    queryKey: ['/api/user/brands', session?.brandId],
    queryFn: async () => {
      if (!session?.brandId) return null;
      const brands = await apiRequestJson('GET', '/api/user/brands');
      return brands.find((b: UserBrand) => b.id === session.brandId);
    },
    enabled: !!session?.brandId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/game-sessions', sessionId, 'chat'],
    enabled: !!sessionId && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequestJson('POST', `/api/game-sessions/${sessionId}/chat`, { message: messageText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', sessionId, 'chat'] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити повідомлення",
        variant: "destructive",
      });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/game-sessions/${sessionId}/chat`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', sessionId, 'chat'] });
      toast({
        title: "Чат очищено",
        description: "Історію чату успішно видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося очистити чат",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleClearChat = () => {
    if (window.confirm('Ви впевнені, що хочете видалити всю історію чату?')) {
      clearChatMutation.mutate();
    }
  };

  if (sessionLoading || messagesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Гру не знайдено</h3>
            <p className="text-gray-500 mb-4">Ця гра не існує або була видалена</p>
            <Link href="/brand-maps">
              <Button>Повернутися до карт брендів</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/brand-maps">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-brand-name">
              {brand?.name || 'Бренд'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-консультант з брендингу
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/brand-board/${sessionId}`}>
            <Button variant="outline" size="sm" data-testid="button-view-map">
              <Eye className="w-4 h-4 mr-2" />
              Карта
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearChat}
            disabled={messages.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-empty-chat">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Привіт! Я ваш AI-консультант</p>
              <p className="text-sm max-w-md mx-auto">
                Я знаю всі відповіді з вашої гри "Душа Бренду" і готовий допомогти з питаннями 
                про ваш бренд, стратегію, позиціонування та розвиток.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  data-testid={`chat-message-${msg.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-red-100 dark:bg-red-900' 
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <span className={`text-xs mt-1 block ${
                      msg.role === 'user' ? 'text-red-200' : 'text-gray-400'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3" data-testid="chat-loading">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишіть повідомлення..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
              data-testid="input-message"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
