import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Palette,
  Save,
  Upload,
  Sparkles,
  Play,
  Gamepad2,
  CheckCircle2,
  MoreVertical,
  Map,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';
import type { GameSession, UserBrand, UserAgent } from '@shared/schema';

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

const LOADING_PHRASES = [
  "Збираю сенси в образ…",
  "Кадр народжується. Дай йому мить ✨",
  "Образ уже в дорозі…",
  "Трохи тиші — і з'явиться картинка",
  "Форма знаходить свій зміст…",
];

function AnimatedLoadingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentIndex >= LOADING_PHRASES.length - 1) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, LOADING_PHRASES.length - 1));
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const currentPhrase = LOADING_PHRASES[currentIndex];
  const nextPhrase = LOADING_PHRASES[Math.min(currentIndex + 1, LOADING_PHRASES.length - 1)];

  return (
    <span className="text-sm inline-block relative overflow-hidden h-5" style={{ minWidth: '300px' }}>
      <span 
        className="absolute left-0 whitespace-nowrap transition-all duration-500 ease-out"
        style={{ 
          transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
          opacity: isAnimating ? 0 : 1
        }}
      >
        {currentPhrase}
      </span>
      <span 
        className="absolute left-0 whitespace-nowrap transition-all duration-500 ease-out"
        style={{ 
          transform: isAnimating ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isAnimating ? 1 : 0
        }}
      >
        {nextPhrase}
      </span>
    </span>
  );
}

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

// Generation template interface (for user - without hidden prompt)
interface GenerationTemplate {
  id: number;
  name: string;
  description: string | null;
  referenceImageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

// Merch type interface (for user - without hidden prompt)
interface MerchType {
  id: number;
  name: string;
  emoji: string;
  sortOrder: number;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system' | 'image';
  content: string;
  imageUrl?: string | null;
  metadata?: any;
  agentId?: string | null;
  agentName?: string | null;
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
  let listItems: { content: string; number?: number }[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let globalOrderedCounter = 0; // Track ordered list numbers globally

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
      if (listType === 'ol') {
        // For ordered lists, use manual numbering to maintain global sequence
        elements.push(
          <div key={elements.length} className="ml-4 space-y-1 my-2">
            {listItems.map((item, i) => (
              <div key={i} className="text-sm flex">
                <span className="mr-2 text-gray-600 dark:text-gray-400 min-w-[1.5rem]">{item.number}.</span>
                <span>{processInlineMarkdown(item.content)}</span>
              </div>
            ))}
          </div>
        );
      } else {
        elements.push(
          <ul key={elements.length} className="list-disc ml-4 space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">{processInlineMarkdown(item.content)}</li>
            ))}
          </ul>
        );
      }
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
      listItems.push({ content: trimmedLine.replace(/^[-•]\s/, '') });
    }
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      globalOrderedCounter++;
      listItems.push({ content: trimmedLine.replace(/^\d+\.\s/, ''), number: globalOrderedCounter });
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
  const params = useParams<{ sessionId?: string; brandId?: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [useLogo, setUseLogo] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedMerchTypeId, setSelectedMerchTypeId] = useState<number | null>(null);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageMessages, setImageMessages] = useState<LocalImageMessage[]>([]);
  const [imageGenerator, setImageGenerator] = useState<'nanobanana' | 'dalle'>('nanobanana');
  const [referenceImages, setReferenceImages] = useState<{ url: string; filename: string }[]>([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [selectedGameSessionId, setSelectedGameSessionId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<{ id: number; url: string; filename: string }[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  let nextImageId = useRef(1);

  // Detect mode - brand-based or session-based
  const isBrandMode = location.startsWith('/brand-chat/brand/');
  const brandIdFromUrl = isBrandMode ? params.brandId : undefined;
  const sessionIdFromUrl = !isBrandMode ? params.sessionId : undefined;
  
  // Active session ID (either from URL or selected from completed games)
  const activeSessionId = sessionIdFromUrl || selectedGameSessionId;

  // Load all user sessions (for brand mode)
  const { data: allSessions = [] } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: isBrandMode && !!user,
  });

  // Filter sessions for the current brand (completed games)
  const brandSessions = isBrandMode && brandIdFromUrl 
    ? allSessions.filter(s => s.brandId === brandIdFromUrl)
    : [];
  const completedBrandSessions = brandSessions.filter(s => s.completed);
  const activeBrandSession = brandSessions.find(s => !s.completed);

  // Auto-select the latest completed game when entering brand mode
  useEffect(() => {
    if (isBrandMode && completedBrandSessions.length > 0 && !selectedGameSessionId) {
      const sortedSessions = completedBrandSessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setSelectedGameSessionId(sortedSessions[0].id);
    }
  }, [isBrandMode, completedBrandSessions, selectedGameSessionId]);

  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ['/api/game-sessions', activeSessionId],
    enabled: !!activeSessionId && !!user,
  });

  // Load brand - either from URL (brand mode) or from session
  const { data: brand } = useQuery<UserBrand>({
    queryKey: ['/api/user/brands', brandIdFromUrl || session?.brandId],
    queryFn: async () => {
      const targetBrandId = brandIdFromUrl || session?.brandId;
      if (!targetBrandId) return null;
      const brands = await apiRequestJson('GET', '/api/user/brands');
      return brands.find((b: UserBrand) => b.id === targetBrandId);
    },
    enabled: !!(brandIdFromUrl || session?.brandId),
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/game-sessions', activeSessionId, 'chat'],
    enabled: !!activeSessionId && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageText, images }: { messageText: string; images?: { url: string }[] }) => {
      return apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/chat`, { 
        message: messageText,
        agentId: selectedAgentId || undefined,
        imageUrls: images?.map(img => img.url),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
      setMessage('');
      setAttachedImages([]);
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
      return apiRequest('DELETE', `/api/game-sessions/${activeSessionId}/chat`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
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

  // Fetch generation templates for user
  const { data: generationTemplates } = useQuery<GenerationTemplate[]>({
    queryKey: ['/api/generation-templates'],
  });

  // Fetch merch types for user
  const { data: merchTypes } = useQuery<MerchType[]>({
    queryKey: ['/api/merch-types'],
  });

  // Fetch user agents (for paid users)
  const { data: userAgents } = useQuery<UserAgent[]>({
    queryKey: ['/api/agents'],
  });
  
  // Get selected agent details
  const selectedAgent = selectedAgentId ? userAgents?.find(a => a.id === selectedAgentId) : null;

  const generateImageMutation = useMutation({
    mutationFn: async ({ prompt, aspectRatio, logoUrl, templateId, merchTypeId, referenceUrls }: { prompt?: string; aspectRatio: string; logoUrl?: string; templateId?: number; merchTypeId?: number; referenceUrls?: string[] }) => {
      return apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/generate-image`, { prompt, aspectRatio, logoUrl, templateId, merchTypeId, referenceUrls });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося згенерувати зображення",
        variant: "destructive",
      });
    },
  });

  // DALL-E image generation mutation
  const generateDalleMutation = useMutation({
    mutationFn: async ({ prompt, size, quality, style }: { prompt: string; size?: string; quality?: string; style?: string }) => {
      return apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/generate-dalle`, { prompt, size, quality, style });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка DALL-E",
        description: error.message || "Не вдалося згенерувати зображення через DALL-E",
        variant: "destructive",
      });
    },
  });

  // Reference image upload
  const handleReferenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingReference(true);
    
    const uploadPromises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const imageData = e.target?.result as string;
            
            const response = await apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/upload-reference`, {
              imageData,
              filename: file.name
            });
            
            if (response.success) {
              setReferenceImages(prev => [...prev, { url: response.url, filename: file.name }]);
              toast({ title: "Зображення додано як референс" });
            }
          } catch (error: any) {
            toast({
              title: "Помилка завантаження",
              description: error.message || "Не вдалося завантажити референс",
              variant: "destructive",
            });
          }
          resolve();
        };
        reader.onerror = () => {
          toast({
            title: "Помилка читання файлу",
            description: file.name,
            variant: "destructive",
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });
    
    await Promise.all(uploadPromises);
    
    setUploadingReference(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReference = (url: string) => {
    setReferenceImages(prev => prev.filter(img => img.url !== url));
  };

  // Compress image and convert to base64
  const compressImage = (file: File, maxWidth = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG for better compression
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Chat image attachment upload with compression
  const handleChatImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Compress and convert to base64
        const base64Data = await compressImage(file, 1024, 0.7);
        
        const imageId = nextImageId.current++;
        setAttachedImages(prev => [...prev, { id: imageId, url: base64Data, filename: file.name }]);
        toast({ title: `Зображення #${imageId} додано` });
      } catch (error: any) {
        toast({
          title: "Помилка обробки зображення",
          description: error.message || "Не вдалося обробити зображення",
          variant: "destructive",
        });
      }
    });
    
    await Promise.all(uploadPromises);
    
    setUploadingAttachment(false);
    if (chatImageInputRef.current) {
      chatImageInputRef.current.value = '';
    }
  };

  const removeAttachedImage = (id: number) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  // Scroll to bottom when messages change or on initial load
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      // ScrollArea uses a Viewport element inside for scrolling
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, imageMessages, scrollToBottom]);

  // Scroll to bottom when chat data loads
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, scrollToBottom]);

  // Additional scroll after images load
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({
      messageText: message.trim(),
      images: attachedImages.length > 0 ? attachedImages : undefined,
    });
  };

  const handleClearChat = () => {
    if (window.confirm('Ви впевнені, що хочете видалити всю історію чату?')) {
      clearChatMutation.mutate();
    }
  };

  const handleGenerateImage = () => {
    // Merch type or template or prompt is required
    const hasMerchType = useLogo && selectedMerchTypeId;
    const hasTemplate = useLogo && selectedTemplateId;
    const hasPrompt = message.trim();
    
    if (!hasMerchType && !hasTemplate && !hasPrompt) {
      toast({
        title: "Виберіть тип мерчу або введіть опис",
        description: "Оберіть тип мерчу, шаблон або напишіть опис зображення",
        variant: "destructive",
      });
      return;
    }
    
    let fullPrompt = message.trim() || '';
    
    if (fullPrompt && selectedStyle && STYLE_PROMPTS[selectedStyle]) {
      fullPrompt = `${fullPrompt}, ${STYLE_PROMPTS[selectedStyle]}`;
    }
    
    if (fullPrompt && customContext.trim()) {
      fullPrompt = `${fullPrompt}. Additional context: ${customContext.trim()}`;
    }
    
    const tempId = `img-${Date.now()}`;
    const selectedTemplate = generationTemplates?.find(t => t.id === selectedTemplateId);
    const selectedMerchType = merchTypes?.find(mt => mt.id === selectedMerchTypeId);
    
    setImageMessages(prev => [...prev, {
      id: tempId,
      prompt: message.trim() || selectedMerchType?.name || selectedTemplate?.name || 'Генерація...',
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString()
    }]);
    
    setMessage('');
    
    // Choose generator based on selection
    if (imageGenerator === 'dalle') {
      // DALL-E generation
      const dalleSize = aspectRatio === '16:9' ? '1792x1024' : aspectRatio === '9:16' ? '1024x1792' : '1024x1024';
      
      generateDalleMutation.mutate({ 
        prompt: fullPrompt, 
        size: dalleSize,
        quality: 'standard',
        style: 'vivid'
      }, {
        onSuccess: (data) => {
          setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
          queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
          if (data.imageUrl) {
            setModalImage(data.imageUrl);
          }
        },
        onError: () => {
          setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
      });
    } else {
      // NanoBanana generation - pass reference URLs for style inspiration
      generateImageMutation.mutate({ 
        prompt: fullPrompt || undefined, 
        aspectRatio,
        logoUrl: useLogo && brand?.logo ? brand.logo : undefined,
        templateId: useLogo && selectedTemplateId ? selectedTemplateId : undefined,
        merchTypeId: useLogo && selectedMerchTypeId ? selectedMerchTypeId : undefined,
        referenceUrls: referenceImages.length > 0 ? referenceImages.map(r => r.url) : undefined
      }, {
        onSuccess: (data) => {
          const imageData = data.imageBase64 || data.imageUrl;
          setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
          queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
          if (imageData) {
            setModalImage(imageData);
          }
        },
        onError: () => {
          setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
      });
    }
  };

  const handleDownloadImage = (imageUrl?: string) => {
    const url = imageUrl || modalImage;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `brand-image-${Date.now()}.png`;
    link.click();
  };

  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  
  const saveToLibraryMutation = useMutation({
    mutationFn: async ({ imageUrl, altText }: { imageUrl: string; altText?: string }) => {
      return apiRequestJson('POST', '/api/media/save-chat-image', { 
        imageUrl, 
        imageBase64: imageUrl.startsWith('data:') ? imageUrl : undefined,
        brandId: brand?.id,
        altText 
      });
    },
    onSuccess: () => {
      toast({ title: "Зображення збережено в бібліотеку" });
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      setSavingImageId(null);
    },
    onError: (error: any) => {
      toast({ title: "Помилка збереження", description: error.message, variant: "destructive" });
      setSavingImageId(null);
    }
  });

  const handleSaveToLibrary = (messageId: string, imageUrl: string, altText?: string) => {
    setSavingImageId(messageId);
    saveToLibraryMutation.mutate({ imageUrl, altText });
  };

  if (sessionLoading || messagesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <BrandSoulSpinner size={48} />
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href={isBrandMode ? "/dashboard" : "/brand-maps"}>
            <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate" data-testid="text-brand-name">
              {brand?.name || 'Бренд'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              AI-консультант з брендингу
            </p>
          </div>
        </div>
        
        {/* Desktop: show all buttons */}
        <div className="hidden sm:flex gap-2 shrink-0">
          <Link href={`/brand-board/${activeSessionId}`}>
            <Button variant="outline" size="sm" className="px-3" data-testid="button-view-map">
              <Eye className="w-4 h-4 mr-2" />
              Карта
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2"
            onClick={handleClearChat}
            disabled={messages.length === 0 && imageMessages.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Mobile: dropdown menu */}
        <div className="flex sm:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {activeSessionId && (
                <DropdownMenuItem onClick={() => setLocation(`/brand-board/${activeSessionId}`)}>
                  <Map className="w-4 h-4 mr-2" />
                  Карта бренду
                </DropdownMenuItem>
              )}
              {isBrandMode && completedBrandSessions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Контекст гри
                  </div>
                  {completedBrandSessions
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map((gameSession, index) => (
                      <DropdownMenuItem 
                        key={gameSession.id}
                        onClick={() => {
                          setSelectedGameSessionId(gameSession.id);
                          queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', gameSession.id, 'chat'] });
                        }}
                      >
                        <CheckCircle2 className={`w-4 h-4 mr-2 ${selectedGameSessionId === gameSession.id ? 'text-green-600' : 'text-gray-400'}`} />
                        Гра #{completedBrandSessions.length - index} - {new Date(gameSession.updatedAt).toLocaleDateString('uk-UA')}
                      </DropdownMenuItem>
                    ))
                  }
                </>
              )}
              {isBrandMode && activeBrandSession && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation(`/game/${activeBrandSession.id}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Продовжити активну гру
                  </DropdownMenuItem>
                </>
              )}
              {isBrandMode && !activeBrandSession && completedBrandSessions.length === 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const response = await apiRequestJson('POST', '/api/game-sessions', {
                        brandId: brandIdFromUrl,
                        currentLevel: 'soul',
                        currentCard: 'soul-start',
                        progress: 0,
                      });
                      setLocation(`/game/${response.id}`);
                    } catch (error) {
                      toast({
                        title: "Помилка",
                        description: "Не вдалося створити гру",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <Play className="w-4 h-4 mr-2" />
                    Почати гру
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleClearChat}
                disabled={messages.length === 0 && imageMessages.length === 0}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистити чат
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Game Context Selector - Show in brand mode (Desktop only) */}
      {isBrandMode && (
        <div className="hidden sm:block mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Gamepad2 className="w-4 h-4" />
              <span>Контекст гри:</span>
            </div>
            
            {completedBrandSessions.length > 0 ? (
              <div className="flex-1 flex items-center gap-2">
                <Select
                  value={selectedGameSessionId || ''}
                  onValueChange={(value) => {
                    setSelectedGameSessionId(value);
                    queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', value, 'chat'] });
                  }}
                >
                  <SelectTrigger className="flex-1 max-w-xs h-8 text-sm">
                    <SelectValue placeholder="Оберіть гру..." />
                  </SelectTrigger>
                  <SelectContent>
                    {completedBrandSessions
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map((gameSession, index) => (
                        <SelectItem key={gameSession.id} value={gameSession.id}>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>
                              Гра #{completedBrandSessions.length - index}
                              {' - '}
                              {new Date(gameSession.updatedAt).toLocaleDateString('uk-UA')}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                
                {activeBrandSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/game/${activeBrandSession.id}`)}
                    className="shrink-0"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Продовжити активну
                  </Button>
                )}
              </div>
            ) : activeBrandSession ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Немає завершених ігор
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLocation(`/game/${activeBrandSession.id}`)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Продовжити гру
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Немає ігор для цього бренду
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await apiRequestJson('POST', '/api/game-sessions', {
                        brandId: brandIdFromUrl,
                        currentLevel: 'soul',
                        currentCard: 'soul-start',
                        progress: 0,
                      });
                      setLocation(`/game/${response.id}`);
                    } catch (error) {
                      toast({
                        title: "Помилка",
                        description: "Не вдалося створити гру",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Почати гру
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {(!activeSessionId && isBrandMode) ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Спочатку пройдіть гру</p>
              <p className="text-sm max-w-md mx-auto">
                Щоб спілкуватися з AI-консультантом, потрібно спочатку пройти гру "Душа Бренду".
                AI використовуватиме ваші відповіді для розуміння контексту бренду.
              </p>
            </div>
          ) : messages.length === 0 && imageMessages.length === 0 ? (
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
                        <div className="max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white">
                          <div className="flex items-start gap-2 text-xs sm:text-sm">
                            <Image className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="break-words">Генерація зображення: {msg.content}</span>
                          </div>
                          <span className="text-xs mt-1 block text-red-200">
                            {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 sm:gap-3" data-testid={`image-response-${msg.id}`}>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900">
                          <Image className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="max-w-[calc(100%-3rem)] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800">
                          <div className="w-full">
                            <img 
                              src={msg.imageUrl} 
                              alt={msg.content}
                              className="w-full max-w-[280px] sm:max-w-xs rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setModalImage(msg.imageUrl!)}
                              data-testid={`img-chat-${msg.id}`}
                            />
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                              <p className="text-xs text-gray-500 hidden sm:block flex-1">Натисніть для збільшення</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleDownloadImage(msg.imageUrl!)}
                                data-testid={`download-image-${msg.id}`}
                              >
                                <Download className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline">Завантажити</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleSaveToLibrary(msg.id, msg.imageUrl!, msg.content)}
                                disabled={savingImageId === msg.id}
                                data-testid={`save-image-${msg.id}`}
                              >
                                {savingImageId === msg.id ? (
                                  <Loader2 className="w-3 h-3 sm:mr-1 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3 sm:mr-1" />
                                )}
                                <span className="hidden sm:inline">Зберегти</span>
                              </Button>
                            </div>
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
                        <>
                          {/* Show attached images if any */}
                          {msg.metadata?.imageUrls && msg.metadata.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(msg.metadata.imageUrls as string[]).map((imgUrl, idx) => (
                                <div key={idx} className="relative">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Attached #${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg border border-red-400 cursor-pointer"
                                    onClick={() => setModalImage(imgUrl)}
                                  />
                                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                    #{idx + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </>
                      ) : (
                        formatMarkdown(msg.content)
                      )}
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        msg.role === 'user' ? 'text-red-200' : 'text-gray-400'
                      }`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {msg.agentName && msg.role === 'assistant' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                            <Bot className="w-3 h-3" />
                            {msg.agentName}
                          </span>
                        )}
                      </div>
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
                          <BrandSoulSpinner size={24} />
                          <AnimatedLoadingText />
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
                    <BrandSoulSpinner size={24} />
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
              
              {/* Image Generator Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Генератор зображень
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageGenerator === 'nanobanana' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageGenerator('nanobanana')}
                    className={imageGenerator === 'nanobanana' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                    data-testid="button-generator-nanobanana"
                  >
                    🍌 NanoBanana
                  </Button>
                  <Button
                    type="button"
                    variant={imageGenerator === 'dalle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageGenerator('dalle')}
                    className={imageGenerator === 'dalle' ? 'bg-green-600 hover:bg-green-700' : ''}
                    data-testid="button-generator-dalle"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    DALL-E 3
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {imageGenerator === 'dalle' 
                    ? 'OpenAI DALL-E 3 - найкраща якість (референси не підтримуються напряму)' 
                    : 'NanoBanana - підтримує референси як URL для стилю, логотипи та мерч генерацію'}
                </p>
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

                  {/* Merch Types Selection */}
                  {useLogo && merchTypes && merchTypes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Тип мерчу
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMerchTypeId(null)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            selectedMerchTypeId === null 
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          data-testid="merch-type-none"
                        >
                          <span className="text-xl">✨</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Вільна генерація</span>
                        </button>
                        {merchTypes.map((mt) => (
                          <button
                            key={mt.id}
                            type="button"
                            onClick={() => setSelectedMerchTypeId(mt.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                              selectedMerchTypeId === mt.id 
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            data-testid={`merch-type-${mt.id}`}
                          >
                            <span className="text-xl">{mt.emoji}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generation Templates Selection (shown only if no merch type selected) */}
                  {useLogo && !selectedMerchTypeId && generationTemplates && generationTemplates.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Шаблон генерації (опціонально)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto overscroll-contain touch-pan-y p-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTemplateId(null)}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            selectedTemplateId === null 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          data-testid="template-none"
                        >
                          <span className="text-2xl mb-1">🎨</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Без шаблону</span>
                        </button>
                        {generationTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              selectedTemplateId === template.id 
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            data-testid={`template-${template.id}`}
                          >
                            {template.referenceImageUrl ? (
                              <img 
                                src={template.referenceImageUrl} 
                                alt={template.name}
                                className="w-12 h-12 object-cover rounded mb-1"
                              />
                            ) : (
                              <span className="text-2xl mb-1">📦</span>
                            )}
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center line-clamp-2">{template.name}</span>
                          </button>
                        ))}
                      </div>
                      {selectedTemplateId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {generationTemplates.find(t => t.id === selectedTemplateId)?.description || 'Шаблон буде використано для генерації'}
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

        <form onSubmit={handleSend} className="p-2 border-t dark:border-gray-700 relative">
          {/* Agent Selector - Desktop only */}
          {userAgents && userAgents.length > 0 && (
            <div className="hidden sm:flex mb-2 items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select
                value={selectedAgentId || "none"}
                onValueChange={(value) => setSelectedAgentId(value === "none" ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Без агента">
                    {selectedAgent ? (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{selectedAgent.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Без агента</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Без агента (стандартний AI)</span>
                  </SelectItem>
                  {userAgents.filter(a => a.isActive).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{agent.name}</span>
                        {agent.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            — {agent.description}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAgent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedAgentId(null)}
                  title="Скинути агента"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {/* Hidden file input for chat images */}
            <input
              ref={chatImageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleChatImageUpload}
              className="hidden"
              data-testid="input-chat-images"
            />
            
            {/* Attached images display with numbered badges */}
            {attachedImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.url} 
                      alt={img.filename}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                      {img.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachedImage(img.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-1 items-center w-full">
            {/* Plus button with dropdown menu (like ChatGPT) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 w-9 h-9 rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => chatImageInputRef.current?.click()}>
                  <Image className="w-4 h-4 mr-2" />
                  Додати зображення
                  {attachedImages.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{attachedImages.length}</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowImageSettings(!showImageSettings)}>
                  <Settings2 className="w-4 h-4 mr-2" />
                  Налаштування генерації
                </DropdownMenuItem>
                {userAgents && userAgents.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      AI Агент
                    </div>
                    <DropdownMenuItem onClick={() => setSelectedAgentId(null)}>
                      <Bot className="w-4 h-4 mr-2" />
                      {!selectedAgentId ? '✓ ' : ''}Без агента
                    </DropdownMenuItem>
                    {userAgents.filter(a => a.isActive).slice(0, 5).map((agent) => (
                      <DropdownMenuItem 
                        key={agent.id} 
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        {selectedAgentId === agent.id ? '✓ ' : ''}{agent.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Input with #N reference highlighting */}
            <div className="flex-1 min-w-0 relative">
              {/* Backdrop with highlighted #N references */}
              <div 
                className="absolute inset-0 px-3 py-2 text-sm pointer-events-none whitespace-pre overflow-hidden text-transparent"
                aria-hidden="true"
              >
                {message.split(/(#\d+)/g).map((part, i) => 
                  /^#\d+$/.test(part) ? (
                    <span key={i} className="bg-primary/30 text-primary font-semibold rounded px-0.5">{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedAgent ? `${selectedAgent.name}...` : "Напишіть повідом..."}
                disabled={sendMessageMutation.isPending || generateImageMutation.isPending || generateDalleMutation.isPending}
                className="w-full text-sm h-10 bg-transparent"
                data-testid="input-message"
              />
            </div>
            
            {/* Desktop: show all buttons */}
            <div className="hidden sm:flex gap-1">
              <Button
                type="button"
                variant={showImageSettings || selectedStyle || customContext ? "default" : "outline"}
                size="icon"
                onClick={() => setShowImageSettings(!showImageSettings)}
                title="Налаштування генерації"
                data-testid="button-toggle-settings"
                className={`shrink-0 w-10 h-10 ${showImageSettings || selectedStyle || customContext ? "bg-purple-600 hover:bg-purple-700" : ""}`}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateImage}
                disabled={(!message.trim() && !selectedMerchTypeId && !selectedTemplateId) || generateImageMutation.isPending || generateDalleMutation.isPending || sendMessageMutation.isPending}
                title={imageGenerator === 'dalle' ? "Згенерувати через DALL-E" : "Згенерувати через NanoBanana"}
                className="shrink-0 w-10 h-10"
                data-testid="button-generate-image"
              >
                {(generateImageMutation.isPending || generateDalleMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : imageGenerator === 'dalle' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Send button - changes to image generation when settings open */}
            {showImageSettings ? (
              <Button 
                type="button"
                size="icon"
                onClick={handleGenerateImage}
                disabled={(!message.trim() && !selectedMerchTypeId && !selectedTemplateId) || generateImageMutation.isPending || generateDalleMutation.isPending || sendMessageMutation.isPending}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-send"
              >
                {(generateImageMutation.isPending || generateDalleMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <Button 
                type="submit"
                size="icon"
                disabled={!message.trim() || sendMessageMutation.isPending || generateImageMutation.isPending || generateDalleMutation.isPending}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                data-testid="button-send"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            )}
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
              <Button 
                variant="secondary" 
                onClick={() => modalImage && handleSaveToLibrary('modal', modalImage, 'Chat image')}
                disabled={saveToLibraryMutation.isPending}
                data-testid="button-modal-save"
              >
                {saveToLibraryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Зберегти в бібліотеку
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
