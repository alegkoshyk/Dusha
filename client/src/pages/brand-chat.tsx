import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Send, 
  ArrowLeft, 
  Trash2, 
  Bot, 
  User,
  Loader2,
  AlertCircle,
  Eye,
  Image,
  Download,
  X,
  Settings2,
  ChevronUp,
  ChevronDown,
  Palette
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';
import type { GameSession, UserBrand } from '@shared/schema';

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Квадрат)' },
  { value: '16:9', label: '16:9 (Широкий)' },
  { value: '9:16', label: '9:16 (Вертикальний)' },
  { value: '4:3', label: '4:3 (Класичний)' },
  { value: '3:4', label: '3:4 (Портрет)' },
  { value: '3:2', label: '3:2 (Фото)' },
  { value: '2:3', label: '2:3 (Вертикальне фото)' },
];

const IMAGE_STYLES = [
  { value: '', label: 'Без стилю', description: 'Генерувати без додаткових стилістичних вказівок' },
  { value: 'photorealistic', label: 'Фотореалістичний', description: 'Як справжнє фото, максимальна деталізація' },
  { value: 'digital-art', label: 'Цифровий арт', description: 'Сучасний цифровий живопис' },
  { value: 'watercolor', label: 'Акварель', description: 'М\'який акварельний стиль' },
  { value: 'oil-painting', label: 'Олійний живопис', description: 'Класичний живопис маслом' },
  { value: 'minimalist', label: 'Мінімалізм', description: 'Простий, чистий дизайн' },
  { value: 'vintage', label: 'Вінтаж', description: 'Ретро стиль, стара естетика' },
  { value: 'cartoon', label: 'Мультфільм', description: 'Яскравий мультиплікаційний стиль' },
  { value: 'anime', label: 'Аніме', description: 'Японський аніме стиль' },
  { value: 'sketch', label: 'Ескіз', description: 'Олівцевий начерк' },
  { value: '3d-render', label: '3D рендер', description: 'Об\'ємна 3D графіка' },
  { value: 'flat-design', label: 'Флет дизайн', description: 'Плоский сучасний дизайн' },
  { value: 'neon', label: 'Неон', description: 'Яскраві неонові кольори' },
  { value: 'cinematic', label: 'Кінематографічний', description: 'Як кадр з фільму' },
];

const STYLE_PROMPTS: Record<string, string> = {
  'photorealistic': 'photorealistic, ultra detailed, 8k, professional photography, sharp focus',
  'digital-art': 'digital art, vibrant colors, detailed illustration, artstation style',
  'watercolor': 'watercolor painting, soft edges, delicate brushstrokes, artistic',
  'oil-painting': 'oil painting, classical art style, rich textures, museum quality',
  'minimalist': 'minimalist design, clean lines, simple shapes, white space',
  'vintage': 'vintage style, retro aesthetic, old photograph, nostalgic',
  'cartoon': 'cartoon style, bright colors, bold outlines, playful',
  'anime': 'anime style, manga art, japanese animation, detailed',
  'sketch': 'pencil sketch, hand drawn, artistic lines, monochrome',
  '3d-render': '3D render, octane render, volumetric lighting, realistic materials',
  'flat-design': 'flat design, vector art, simple shapes, modern UI style',
  'neon': 'neon lights, cyberpunk, glowing colors, dark background',
  'cinematic': 'cinematic shot, dramatic lighting, movie scene, film grain',
};

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system' | 'image';
  content: string;
  imageUrl?: string | null;
  metadata?: any;
  createdAt: string;
}

interface LocalImageMessage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  isLoading: boolean;
  createdAt: string;
}

export default function BrandChat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageMessages, setImageMessages] = useState<LocalImageMessage[]>([]);
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
      setImageMessages([]);
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

  const generateImageMutation = useMutation({
    mutationFn: async ({ prompt, aspectRatio }: { prompt: string; aspectRatio: string }) => {
      return apiRequestJson('POST', `/api/game-sessions/${sessionId}/generate-image`, { prompt, aspectRatio });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося згенерувати зображення",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, imageMessages]);

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

  const handleGenerateImage = () => {
    if (!message.trim()) {
      toast({
        title: "Введіть опис",
        description: "Напишіть опис зображення для генерації",
        variant: "destructive",
      });
      return;
    }
    
    let fullPrompt = message.trim();
    
    if (selectedStyle && STYLE_PROMPTS[selectedStyle]) {
      fullPrompt = `${fullPrompt}, ${STYLE_PROMPTS[selectedStyle]}`;
    }
    
    if (customContext.trim()) {
      fullPrompt = `${fullPrompt}. Additional context: ${customContext.trim()}`;
    }
    
    const tempId = `img-${Date.now()}`;
    
    setImageMessages(prev => [...prev, {
      id: tempId,
      prompt: message.trim(),
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString()
    }]);
    
    setMessage('');
    
    generateImageMutation.mutate({ prompt: fullPrompt, aspectRatio }, {
      onSuccess: (data) => {
        const imageData = data.imageBase64 || data.imageUrl;
        // Remove temporary loading message - image is now saved in database
        setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
        // Refetch chat to show image from database
        queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', sessionId, 'chat'] });
        if (imageData) {
          setModalImage(imageData);
        }
      },
      onError: () => {
        setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    });
  };

  const handleDownloadImage = (imageUrl?: string) => {
    const url = imageUrl || modalImage;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `brand-image-${Date.now()}.png`;
    link.click();
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
            disabled={messages.length === 0 && imageMessages.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && imageMessages.length === 0 ? (
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
              {/* Database messages (including images with role='image') */}
              {messages.map((msg) => {
                // Image message from database
                if (msg.role === 'image' && msg.imageUrl) {
                  return (
                    <div key={msg.id} className="space-y-3">
                      <div className="flex gap-3 flex-row-reverse" data-testid={`image-request-${msg.id}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900">
                          <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-red-600 text-white">
                          <div className="flex items-center gap-2 text-sm">
                            <Image className="w-4 h-4" />
                            <span>Генерація зображення: {msg.content}</span>
                          </div>
                          <span className="text-xs mt-1 block text-red-200">
                            {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3" data-testid={`image-response-${msg.id}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900">
                          <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                          <div>
                            <img 
                              src={msg.imageUrl} 
                              alt={msg.content}
                              className="max-w-xs rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setModalImage(msg.imageUrl!)}
                              data-testid={`img-chat-${msg.id}`}
                            />
                            <p className="text-xs text-gray-500 mt-2">Натисніть для збільшення</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Regular chat message
                return (
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
                );
              })}
              
              {/* Local loading images (temporary while generating) */}
              {imageMessages.map((imgMsg) => (
                <div key={imgMsg.id} className="space-y-3">
                  <div className="flex gap-3 flex-row-reverse" data-testid={`image-request-${imgMsg.id}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900">
                      <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-red-600 text-white">
                      <div className="flex items-center gap-2 text-sm">
                        <Image className="w-4 h-4" />
                        <span>Генерація зображення: {imgMsg.prompt}</span>
                      </div>
                      <span className="text-xs mt-1 block text-red-200">
                        {new Date(imgMsg.createdAt).toLocaleTimeString('uk-UA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3" data-testid={`image-response-${imgMsg.id}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900">
                      <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                      {imgMsg.isLoading ? (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Генерую зображення...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">Не вдалося згенерувати зображення</p>
                      )}
                    </div>
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

        <Collapsible open={showImageSettings} onOpenChange={setShowImageSettings}>
          <CollapsibleContent className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Налаштування генерації зображення
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowImageSettings(false)}
                  data-testid="button-close-settings"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Стиль зображення
                  </label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger data-testid="select-style">
                      <SelectValue placeholder="Виберіть стиль" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value || 'none'}>
                          <div className="flex flex-col">
                            <span>{style.label}</span>
                            <span className="text-xs text-gray-500">{style.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Співвідношення сторін
                  </label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger data-testid="select-aspect-ratio-settings">
                      <SelectValue placeholder="Розмір" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Додатковий контекст / інструкції
                </label>
                <Textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Наприклад: використовуй кольори бренду, додай логотип в кутку, зроби фон світлим..."
                  className="min-h-[80px] resize-none"
                  data-testid="textarea-context"
                />
              </div>
              
              {(selectedStyle || customContext) && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Settings2 className="w-4 h-4" />
                  <span>
                    Активні налаштування: 
                    {selectedStyle && ` ${IMAGE_STYLES.find(s => s.value === selectedStyle)?.label}`}
                    {selectedStyle && customContext && ','}
                    {customContext && ' + власні інструкції'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedStyle(''); setCustomContext(''); }}
                    className="text-xs h-6 px-2"
                    data-testid="button-clear-settings"
                  >
                    Скинути
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700">
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишіть повідомлення або опис зображення..."
              disabled={sendMessageMutation.isPending || generateImageMutation.isPending}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              type="button"
              variant={showImageSettings || selectedStyle || customContext ? "default" : "outline"}
              size="icon"
              onClick={() => setShowImageSettings(!showImageSettings)}
              title="Налаштування генерації"
              data-testid="button-toggle-settings"
              className={showImageSettings || selectedStyle || customContext ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={handleGenerateImage}
              disabled={!message.trim() || generateImageMutation.isPending || sendMessageMutation.isPending}
              title="Згенерувати зображення"
              data-testid="button-generate-image"
            >
              {generateImageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Image className="w-4 h-4" />
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending || generateImageMutation.isPending}
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

      <Dialog open={!!modalImage} onOpenChange={(open) => !open && setModalImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90">
          <DialogTitle className="sr-only">Перегляд зображення</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setModalImage(null)}
              data-testid="button-close-modal"
            >
              <X className="w-6 h-6" />
            </Button>
            <img 
              src={modalImage || ''} 
              alt="Згенероване зображення" 
              className="w-full h-auto max-h-[85vh] object-contain"
              data-testid="img-modal"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => handleDownloadImage()}
                data-testid="button-modal-download"
              >
                <Download className="w-4 h-4 mr-2" />
                Завантажити
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
