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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  { value: '', label: 'Без стилю', description: 'Генерувати без додаткових стилістичних вказівок', icon: '⚪', color: 'bg-gray-200' },
  { value: 'photorealistic', label: 'Фотореалістичний', description: 'Як справжнє фото, максимальна деталізація', icon: '📷', color: 'bg-gradient-to-r from-gray-600 to-gray-400' },
  { value: 'digital-art', label: 'Цифровий арт', description: 'Сучасний цифровий живопис', icon: '🎨', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'watercolor', label: 'Акварель', description: 'М\'який акварельний стиль', icon: '💧', color: 'bg-gradient-to-r from-blue-200 to-cyan-200' },
  { value: 'oil-painting', label: 'Олійний живопис', description: 'Класичний живопис маслом', icon: '🖼️', color: 'bg-gradient-to-r from-amber-600 to-yellow-500' },
  { value: 'minimalist', label: 'Мінімалізм', description: 'Простий, чистий дизайн', icon: '⬜', color: 'bg-gradient-to-r from-gray-100 to-gray-300' },
  { value: 'vintage', label: 'Вінтаж', description: 'Ретро стиль, стара естетика', icon: '📜', color: 'bg-gradient-to-r from-amber-200 to-orange-300' },
  { value: 'cartoon', label: 'Мультфільм', description: 'Яскравий мультиплікаційний стиль', icon: '🎪', color: 'bg-gradient-to-r from-yellow-400 to-red-400' },
  { value: 'anime', label: 'Аніме', description: 'Японський аніме стиль', icon: '⭐', color: 'bg-gradient-to-r from-pink-400 to-purple-400' },
  { value: 'sketch', label: 'Ескіз', description: 'Олівцевий начерк', icon: '✏️', color: 'bg-gradient-to-r from-gray-300 to-gray-500' },
  { value: '3d-render', label: '3D рендер', description: 'Об\'ємна 3D графіка', icon: '🔮', color: 'bg-gradient-to-r from-indigo-500 to-blue-600' },
  { value: 'flat-design', label: 'Флет дизайн', description: 'Плоский сучасний дизайн', icon: '🔷', color: 'bg-gradient-to-r from-teal-400 to-cyan-500' },
  { value: 'neon', label: 'Неон', description: 'Яскраві неонові кольори', icon: '💜', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { value: 'cinematic', label: 'Кінематографічний', description: 'Як кадр з фільму', icon: '🎬', color: 'bg-gradient-to-r from-gray-800 to-gray-600' },
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

const MERCH_TYPES = [
  { value: '', label: 'Без мерчу', icon: '🎨', description: 'Вільна генерація з логотипом' },
  { value: 'tshirt', label: 'Футболка', icon: '👕', description: 'Біла футболка з логотипом' },
  { value: 'hoodie', label: 'Худі', icon: '🧥', description: 'Чорне худі з логотипом' },
  { value: 'cap', label: 'Кепка', icon: '🧢', description: 'Бейсболка з вишитим логотипом' },
  { value: 'mug', label: 'Чашка', icon: '☕', description: 'Керамічна чашка з логотипом' },
  { value: 'bag', label: 'Сумка', icon: '👜', description: 'Тканинна сумка шопер' },
  { value: 'notebook', label: 'Блокнот', icon: '📓', description: 'Брендований блокнот' },
  { value: 'phone-case', label: 'Чохол', icon: '📱', description: 'Чохол для телефону' },
  { value: 'poster', label: 'Постер', icon: '🖼️', description: 'Рекламний постер' },
];

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

function formatMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const processInlineMarkdown = (line: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-white">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }
    return parts;
  };

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-4 space-y-1 my-2`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{processInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    if (trimmedLine.match(/^#{1,3}\s/)) {
      flushList();
      const level = (trimmedLine.match(/^#+/) || [''])[0].length;
      const content = trimmedLine.replace(/^#+\s/, '');
      const className = level === 1 ? 'text-base font-bold mt-3 mb-2' : 
                        level === 2 ? 'text-sm font-semibold mt-2 mb-1' : 
                        'text-sm font-medium mt-2 mb-1';
      elements.push(
        <div key={idx} className={`${className} text-gray-900 dark:text-white`}>
          {processInlineMarkdown(content)}
        </div>
      );
    }
    else if (trimmedLine.match(/^[-•]\s/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmedLine.replace(/^[-•]\s/, ''));
    }
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
    }
    else if (trimmedLine === '') {
      flushList();
      elements.push(<div key={idx} className="h-2" />);
    }
    else {
      flushList();
      elements.push(
        <p key={idx} className="text-sm my-1">
          {processInlineMarkdown(trimmedLine)}
        </p>
      );
    }
  });

  flushList();
  return <div className="space-y-0.5">{elements}</div>;
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
  const [useLogo, setUseLogo] = useState(false);
  const [merchType, setMerchType] = useState('');
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
    mutationFn: async ({ prompt, aspectRatio, logoUrl, merchType }: { prompt: string; aspectRatio: string; logoUrl?: string; merchType?: string }) => {
      return apiRequestJson('POST', `/api/game-sessions/${sessionId}/generate-image`, { prompt, aspectRatio, logoUrl, merchType });
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
    
    generateImageMutation.mutate({ 
      prompt: fullPrompt, 
      aspectRatio,
      logoUrl: useLogo && brand?.logo ? brand.logo : undefined,
      merchType: useLogo && merchType ? merchType : undefined
    }, {
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
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      ) : (
                        formatMarkdown(msg.content)
                      )}
                      <span className={`text-xs mt-2 block ${
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
          <CollapsibleContent className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 max-h-[50vh] overflow-y-auto overscroll-contain touch-pan-y">
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
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${style.color}`}>
                              {style.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{style.label}</span>
                              <span className="text-xs text-gray-500">{style.description}</span>
                            </div>
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
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center"
                      style={{
                        width: aspectRatio === '9:16' || aspectRatio === '3:4' || aspectRatio === '2:3' ? '32px' : 
                               aspectRatio === '16:9' || aspectRatio === '3:2' ? '56px' : 
                               aspectRatio === '4:3' ? '48px' : '40px',
                        height: aspectRatio === '16:9' || aspectRatio === '3:2' ? '32px' : 
                                aspectRatio === '9:16' ? '56px' : 
                                aspectRatio === '3:4' || aspectRatio === '2:3' ? '48px' :
                                aspectRatio === '4:3' ? '36px' : '40px',
                      }}
                      data-testid="aspect-ratio-preview"
                    >
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        {aspectRatio}
                      </span>
                    </div>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger data-testid="select-aspect-ratio-settings" className="flex-1">
                        <SelectValue placeholder="Розмір" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded"
                                style={{
                                  width: ratio.value === '9:16' || ratio.value === '3:4' || ratio.value === '2:3' ? '12px' : 
                                         ratio.value === '16:9' || ratio.value === '3:2' ? '24px' : 
                                         ratio.value === '4:3' ? '20px' : '16px',
                                  height: ratio.value === '16:9' || ratio.value === '3:2' ? '12px' : 
                                          ratio.value === '9:16' ? '24px' : 
                                          ratio.value === '3:4' || ratio.value === '2:3' ? '20px' :
                                          ratio.value === '4:3' ? '15px' : '16px',
                                }}
                              />
                              <span>{ratio.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
              
              {/* Logo toggle for image generation */}
              {brand?.logo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <img 
                        src={brand.logo} 
                        alt="Brand logo" 
                        className="w-10 h-10 rounded object-contain bg-gray-100 dark:bg-gray-700 p-1"
                        data-testid="img-logo-preview"
                      />
                      <div className="flex flex-col">
                        <Label htmlFor="use-logo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Використовувати логотип
                        </Label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Логотип буде референсом для генерації
                        </span>
                      </div>
                    </div>
                    <Switch
                      id="use-logo"
                      checked={useLogo}
                      onCheckedChange={setUseLogo}
                      data-testid="switch-use-logo"
                    />
                  </div>

                  {useLogo && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Тип мерчу / продукту
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {MERCH_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setMerchType(type.value)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              merchType === type.value 
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            data-testid={`merch-type-${type.value || 'none'}`}
                          >
                            <span className="text-2xl mb-1">{type.icon}</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
                          </button>
                        ))}
                      </div>
                      {merchType && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {MERCH_TYPES.find(t => t.value === merchType)?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 [&>button]:text-white [&>button]:hover:bg-white/20">
          <DialogTitle className="sr-only">Перегляд зображення</DialogTitle>
          <div className="relative pt-8">
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
