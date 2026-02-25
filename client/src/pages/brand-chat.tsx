import { useState, useRef, useEffect, useCallback } from 'react';
import { resolveMediaUrl } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';
import type { GameSession, UserBrand, UserAgent, BrandChat as BrandChatType, BrandChatMessage } from '@shared/schema';

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
  startedAt?: number;
}

function ImageGenerationSkeleton({ startedAt }: { startedAt?: number }) {
  const [elapsed, setElapsed] = useState(0);
  const estimatedTotal = 25;
  
  useEffect(() => {
    const start = startedAt || Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [startedAt]);
  
  const progress = Math.min(95, Math.round((elapsed / estimatedTotal) * 100));
  const phase = elapsed < 5 ? 'Підготовка запиту...' 
    : elapsed < 12 ? 'Генерація зображення...' 
    : elapsed < 20 ? 'Фінальна обробка...' 
    : 'Майже готово...';
  
  return (
    <div className="space-y-2">
      <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-2xl font-bold text-gray-500 dark:text-gray-300">{progress}%</span>
          </div>
        </div>
      </div>
      <div className="w-48">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{phase}</p>
      </div>
    </div>
  );
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

function AudienceItemWithSegments({ audience, isSelected, onSelect }: {
  audience: { id: string; name: string; description: string | null; ageRange: string | null; gender: string | null };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: segments } = useQuery<{ id: string; name: string; personaName: string | null; personaAge: number | null; personaJob: string | null; personaStory: string | null; description: string | null }[]>({
    queryKey: ['/api/target-audiences', audience.id, 'segments'],
    enabled: expanded,
    queryFn: async () => {
      return apiRequestJson('GET', `/api/target-audiences/${audience.id}/segments`);
    },
  });

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSelect}
          className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
            isSelected 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
            {isSelected && <Check className="w-3 h-3" />}
          </div>
          <span className="text-lg">👥</span>
          <div className="text-left flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{audience.name}</span>
            {audience.ageRange && (
              <span className="block text-xs text-gray-400">{audience.ageRange}{audience.gender && audience.gender !== 'all' ? ` • ${audience.gender}` : ''}</span>
            )}
            {audience.description && (
              <span className="block text-xs text-gray-400 truncate">{audience.description}</span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-2 flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && segments && segments.length > 0 && (
        <div className="ml-6 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 px-2">Персони / Сегменти</span>
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
            >
              <span className="text-sm mt-0.5">🧑</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {seg.personaName || seg.name}
                </span>
                {seg.personaAge && (
                  <span className="text-xs text-gray-400">, {seg.personaAge} р.</span>
                )}
                {seg.personaJob && (
                  <span className="block text-[11px] text-gray-400">{seg.personaJob}</span>
                )}
                {seg.description && (
                  <span className="block text-[11px] text-gray-400 line-clamp-2">{seg.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {expanded && segments && segments.length === 0 && (
        <div className="ml-6 px-3 py-2 text-xs text-gray-400">
          Немає сегментів / персон
        </div>
      )}
    </div>
  );
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
    const [useLogo, setUseLogo] = useState(false);
  const [showMerchMenu, setShowMerchMenu] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [selectedMerchTypeIds, setSelectedMerchTypeIds] = useState<number[]>([]);
  const [generationQueue, setGenerationQueue] = useState<{ type: 'merch' | 'template'; id: number }[]>([]);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageMessages, setImageMessages] = useState<LocalImageMessage[]>([]);
  const [useNanoBananaPro, setUseNanoBananaPro] = useState(false);
  const [nanoBananaResolution, setNanoBananaResolution] = useState('standard');
  const [imageGenerationMode, setImageGenerationMode] = useState(false);
  const [referenceImages, setReferenceImages] = useState<{ url: string; filename: string }[]>([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [selectedGameSessionId, setSelectedGameSessionId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [selectedBrandChatId, setSelectedBrandChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
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

  // Auto-select the latest completed game (or active game if no completed ones) when entering brand mode
  useEffect(() => {
    if (isBrandMode && !selectedGameSessionId) {
      if (completedBrandSessions.length > 0) {
        const sortedSessions = completedBrandSessions.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setSelectedGameSessionId(sortedSessions[0].id);
      } else if (activeBrandSession) {
        setSelectedGameSessionId(activeBrandSession.id);
      }
    }
  }, [isBrandMode, completedBrandSessions, activeBrandSession, selectedGameSessionId]);

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
    enabled: !isBrandMode && !!activeSessionId && !!user,
  });

  // Brand chats (multi-thread per brand)
  const { data: brandChats = [], isLoading: brandChatsLoading } = useQuery<BrandChatType[]>({
    queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'],
    enabled: isBrandMode && !!brandIdFromUrl && !!user,
  });

  // Auto-select first brand chat when list loads
  useEffect(() => {
    if (isBrandMode && brandChats.length > 0 && !selectedBrandChatId) {
      setSelectedBrandChatId(brandChats[0].id);
    }
  }, [isBrandMode, brandChats, selectedBrandChatId]);

  // Sync context from selected brand chat
  useEffect(() => {
    if (isBrandMode && selectedBrandChatId) {
      const chat = brandChats.find(c => c.id === selectedBrandChatId);
      if (chat) {
        setSelectedAgentId(chat.agentId || null);
        setSelectedProductIds(chat.productIds || []);
        setSelectedAudienceIds(chat.audienceIds || []);
        if (chat.gameSessionId) setSelectedGameSessionId(chat.gameSessionId);
      }
    }
  }, [isBrandMode, selectedBrandChatId, brandChats]);

  const { data: brandChatMessages = [], isLoading: brandChatMessagesLoading } = useQuery<BrandChatMessage[]>({
    queryKey: ['/api/brand-chats', selectedBrandChatId, 'messages'],
    enabled: isBrandMode && !!selectedBrandChatId && !!user,
  });

  const displayMessages = isBrandMode ? brandChatMessages as any[] : messages;
  const displayMessagesLoading = isBrandMode ? brandChatMessagesLoading : messagesLoading;

  const createBrandChatMutation = useMutation({
    mutationFn: async (name?: string) => {
      return apiRequestJson('POST', `/api/brands/${brandIdFromUrl}/brand-chats`, { name: name || 'Новий чат' });
    },
    onSuccess: (newChat: BrandChatType) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'] });
      setSelectedBrandChatId(newChat.id);
      setImageMessages([]);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити чат", variant: "destructive" });
    },
  });

  const deleteBrandChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return apiRequest('DELETE', `/api/brand-chats/${chatId}`);
    },
    onSuccess: (_: any, chatId: string) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'] });
      if (selectedBrandChatId === chatId) {
        const remaining = brandChats.filter(c => c.id !== chatId);
        setSelectedBrandChatId(remaining.length > 0 ? remaining[0].id : null);
        setImageMessages([]);
      }
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити чат", variant: "destructive" });
    },
  });

  const renameBrandChatMutation = useMutation({
    mutationFn: async ({ chatId, name }: { chatId: string; name: string }) => {
      return apiRequestJson('PATCH', `/api/brand-chats/${chatId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'] });
      setEditingChatId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося перейменувати чат", variant: "destructive" });
    },
  });

  const updateBrandChatContextMutation = useMutation({
    mutationFn: async (updates: { agentId?: string | null; audienceIds?: string[]; productIds?: string[]; gameSessionId?: string | null }) => {
      if (!selectedBrandChatId) return;
      return apiRequestJson('PATCH', `/api/brand-chats/${selectedBrandChatId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageText, images }: { messageText: string; images?: { url: string }[] }) => {
      if (isBrandMode && selectedBrandChatId) {
        return apiRequestJson('POST', `/api/brand-chats/${selectedBrandChatId}/messages`, {
          message: messageText,
          imageUrls: images?.map(img => img.url),
          agentId: selectedAgentId || null,
          productIds: selectedProductIds.length > 0 ? selectedProductIds : null,
          audienceIds: selectedAudienceIds.length > 0 ? selectedAudienceIds : null,
          gameSessionId: selectedGameSessionId || null,
        });
      }
      return apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/chat`, { 
        message: messageText,
        agentId: selectedAgentId || undefined,
        productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        audienceIds: selectedAudienceIds.length > 0 ? selectedAudienceIds : undefined,
        imageUrls: images?.map(img => img.url),
      });
    },
    onSuccess: (_, variables) => {
      if (isBrandMode && selectedBrandChatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/brand-chats', selectedBrandChatId, 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/brands', brandIdFromUrl, 'brand-chats'] });
        // Auto-name chat from first message if still "Новий чат"
        const currentChat = brandChats.find(c => c.id === selectedBrandChatId);
        if (currentChat?.name === 'Новий чат' && variables.messageText) {
          const autoName = variables.messageText.slice(0, 40).trim() + (variables.messageText.length > 40 ? '...' : '');
          renameBrandChatMutation.mutate({ chatId: selectedBrandChatId, name: autoName });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
      }
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
      if (isBrandMode && selectedBrandChatId) {
        return apiRequest('DELETE', `/api/brand-chats/${selectedBrandChatId}/messages`);
      }
      return apiRequest('DELETE', `/api/game-sessions/${activeSessionId}/chat`);
    },
    onSuccess: () => {
      if (isBrandMode && selectedBrandChatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/brand-chats', selectedBrandChatId, 'messages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
      }
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

  // Fetch products for this brand
  const brandIdForQueries = brandIdFromUrl || session?.brandId;
  const { data: brandProducts } = useQuery<{ id: string; name: string; shortDescription: string | null; category: string | null; mainImageUrl: string | null }[]>({
    queryKey: ['/api/brands', brandIdForQueries, 'products'],
    queryFn: async () => {
      if (!brandIdForQueries) return [];
      return apiRequestJson('GET', `/api/brands/${brandIdForQueries}/products`);
    },
    enabled: !!brandIdForQueries,
  });

  // Fetch target audiences for this brand
  const { data: brandAudiences } = useQuery<{ id: string; name: string; description: string | null; ageRange: string | null; gender: string | null }[]>({
    queryKey: ['/api/brands', brandIdForQueries, 'target-audiences'],
    queryFn: async () => {
      if (!brandIdForQueries) return [];
      return apiRequestJson('GET', `/api/brands/${brandIdForQueries}/target-audiences`);
    },
    enabled: !!brandIdForQueries,
  });

  const hasSelectedProducts = selectedProductIds.length > 0;
  const hasSelectedAudiences = selectedAudienceIds.length > 0;
  const allProductsSelected = brandProducts && brandProducts.length > 0 && selectedProductIds.length === brandProducts.length;
  const allAudiencesSelected = brandAudiences && brandAudiences.length > 0 && selectedAudienceIds.length === brandAudiences.length;

  const generateImageMutation = useMutation({
    mutationFn: async ({ prompt, aspectRatio, logoUrl, templateId, merchTypeId, referenceUrls, usePro, resolution, agentId, productIds, audienceIds }: { prompt?: string; aspectRatio: string; logoUrl?: string; templateId?: number; merchTypeId?: number; referenceUrls?: string[]; usePro?: boolean; resolution?: string; agentId?: string; productIds?: string[]; audienceIds?: string[] }) => {
      return apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/generate-image`, { prompt, aspectRatio, logoUrl, templateId, merchTypeId, referenceUrls, usePro, resolution, agentId, productIds, audienceIds });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося згенерувати зображення",
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

  // Chat image attachment upload with compression and upload to storage
  const handleChatImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Compress to 1024px and convert to base64
        const base64Data = await compressImage(file, 1024, 0.8);
        
        // Upload compressed image to object storage
        const response = await apiRequestJson('POST', `/api/game-sessions/${activeSessionId}/upload-reference`, {
          imageData: base64Data,
          filename: file.name
        });
        
        if (response.success) {
          const imageId = nextImageId.current++;
          setAttachedImages(prev => [...prev, { id: imageId, url: response.url, filename: file.name }]);
          toast({ title: `Зображення #${imageId} додано` });
        }
      } catch (error: any) {
        toast({
          title: "Помилка завантаження",
          description: error.message || "Не вдалося завантажити зображення",
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
  }, [displayMessages, imageMessages, scrollToBottom]);

  // Scroll to bottom when chat data loads
  useEffect(() => {
    if (displayMessages && displayMessages.length > 0) {
      setTimeout(scrollToBottom, 50);
    }
  }, [displayMessages, scrollToBottom]);

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

  const handleGenerateImage = async () => {
    // Build generation queue from selections
    const queue: { type: 'merch' | 'template' | 'prompt'; id?: number; prompt?: string }[] = [];
    
    // Add merch types to queue
    selectedMerchTypeIds.forEach(id => queue.push({ type: 'merch', id }));
    
    // Add templates to queue
    selectedTemplateIds.forEach(id => queue.push({ type: 'template', id }));
    
    // Add prompt-based generation if no merch/templates but has message
    const hasPrompt = message.trim();
    if (queue.length === 0 && hasPrompt) {
      queue.push({ type: 'prompt', prompt: message.trim() });
    }
    
    if (queue.length === 0) {
      toast({
        title: "Оберіть мерч, шаблон або введіть опис",
        description: "Виберіть тип мерчу, шаблон або напишіть опис зображення",
        variant: "destructive",
      });
      return;
    }
    
    const userPrompt = message.trim();
    setMessage('');
    
    // Start queue processing
    setGenerationProgress({ current: 0, total: queue.length });
    
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setGenerationProgress({ current: i + 1, total: queue.length });
      
      let fullPrompt = userPrompt || '';
      // Always include style in the prompt (even without user text)
      const stylePrompt = selectedStyle && STYLE_PROMPTS[selectedStyle] ? STYLE_PROMPTS[selectedStyle] : '';
      if (stylePrompt) {
        fullPrompt = fullPrompt ? `${fullPrompt}, ${stylePrompt}` : stylePrompt;
      }
      
      const tempId = `img-${Date.now()}-${i}`;
      const selectedTemplate = item.type === 'template' ? generationTemplates?.find(t => t.id === item.id) : null;
      const selectedMerchType = item.type === 'merch' ? merchTypes?.find(mt => mt.id === item.id) : null;
      
      setImageMessages(prev => [...prev, {
        id: tempId,
        prompt: selectedMerchType?.name || selectedTemplate?.name || userPrompt || 'Генерація...',
        imageUrl: null,
        isLoading: true,
        createdAt: new Date().toISOString(),
        startedAt: Date.now()
      }]);
      
      try {
        await new Promise<void>((resolve, reject) => {
          generateImageMutation.mutate({ 
            prompt: fullPrompt || undefined, 
            aspectRatio,
            logoUrl: useLogo && brand?.logo ? resolveMediaUrl(brand.logo) : undefined,
            templateId: item.type === 'template' ? item.id : undefined,
            merchTypeId: item.type === 'merch' ? item.id : undefined,
            referenceUrls: referenceImages.length > 0 ? referenceImages.map(r => r.url) : undefined,
            usePro: useNanoBananaPro,
            resolution: nanoBananaResolution,
            agentId: selectedAgentId || undefined,
            productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
            audienceIds: selectedAudienceIds.length > 0 ? selectedAudienceIds : undefined
          }, {
            onSuccess: (data) => {
              const imageData = data.imageBase64 || data.imageUrl;
              setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
              queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId, 'chat'] });
              if (imageData && i === queue.length - 1) {
                setModalImage(imageData);
              }
              resolve();
            },
            onError: (error) => {
              setImageMessages(prev => prev.filter(msg => msg.id !== tempId));
              reject(error);
            }
          });
        });
      } catch (error: any) {
        console.error('Generation error:', error);
        toast({
          title: "Помилка генерації",
          description: error?.message || "Не вдалося згенерувати зображення. Спробуйте ще раз.",
          variant: "destructive",
        });
      }
    }
    
    // Clear selections after queue completes
    setGenerationProgress(null);
    setSelectedMerchTypeIds([]);
    setSelectedTemplateIds([]);
    setUseLogo(false);
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

  if (sessionLoading || displayMessagesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <BrandSoulSpinner size={48} />
        </div>
      </div>
    );
  }

  if (!isBrandMode && !session) {
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
    <div className={isBrandMode ? "fixed inset-0 z-[60] flex bg-background dark:bg-gray-950" : "container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] flex flex-col"}>
      {/* ======== LEFT SIDEBAR (brand mode only) ======== */}
      {isBrandMode && (
        <aside className="hidden sm:flex w-60 flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 shrink-0">
          {/* Sidebar header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{brand?.name || 'Бренд'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">AI Консультант</p>
            </div>
          </div>
          {/* New chat button */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-800">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => createBrandChatMutation.mutate()}
              disabled={createBrandChatMutation.isPending}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Новий чат
            </Button>
          </div>
          {/* Chat list */}
          <ScrollArea className="flex-1">
            {brandChatsLoading ? (
              <div className="p-4 flex justify-center"><BrandSoulSpinner size={24} /></div>
            ) : brandChats.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 space-y-2">
                <p>Немає чатів</p>
                <p className="text-[10px]">Натисніть "Новий чат" щоб почати</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {brandChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                      selectedBrandChatId === chat.id
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (editingChatId === chat.id) return;
                      setSelectedBrandChatId(chat.id);
                      setImageMessages([]);
                    }}
                  >
                    {editingChatId === chat.id ? (
                      <input
                        className="flex-1 text-xs bg-white dark:bg-gray-700 border rounded px-1.5 py-0.5 outline-none min-w-0"
                        value={editingChatName}
                        autoFocus
                        onChange={e => setEditingChatName(e.target.value)}
                        onBlur={() => {
                          if (editingChatName.trim()) {
                            renameBrandChatMutation.mutate({ chatId: chat.id, name: editingChatName.trim() });
                          } else {
                            setEditingChatId(null);
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editingChatName.trim()) {
                            renameBrandChatMutation.mutate({ chatId: chat.id, name: editingChatName.trim() });
                          } else if (e.key === 'Escape') {
                            setEditingChatId(null);
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="flex-1 text-xs truncate min-w-0"
                        onDoubleClick={() => {
                          setEditingChatId(chat.id);
                          setEditingChatName(chat.name);
                        }}
                      >
                        {chat.name}
                      </span>
                    )}
                    <button
                      className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 shrink-0"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Видалити чат "${chat.name}"?`)) {
                          deleteBrandChatMutation.mutate(chat.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {/* Game Context Selector - bottom of sidebar */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <Gamepad2 className="w-3 h-3" />
              <span>Контекст гри</span>
            </div>
            {completedBrandSessions.length > 0 ? (
              <div className="space-y-1.5">
                <Select
                  value={selectedGameSessionId || ''}
                  onValueChange={(value) => {
                    setSelectedGameSessionId(value);
                    queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', value, 'chat'] });
                  }}
                >
                  <SelectTrigger className="w-full h-7 text-xs">
                    <SelectValue placeholder="Оберіть гру..." />
                  </SelectTrigger>
                  <SelectContent>
                    {completedBrandSessions
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map((gameSession, index) => (
                        <SelectItem key={gameSession.id} value={gameSession.id}>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                            <span className="text-xs">
                              Гра #{completedBrandSessions.length - index} · {new Date(gameSession.updatedAt).toLocaleDateString('uk-UA')}
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
                    className="w-full h-7 text-xs"
                    onClick={() => setLocation(`/game/${activeBrandSession.id}`)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Продовжити активну
                  </Button>
                )}
              </div>
            ) : activeBrandSession ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    <Play className="w-2.5 h-2.5 mr-1" />
                    Активна
                  </Badge>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {Math.min(Math.round(activeBrandSession.progress || 0), 100)}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => setLocation(`/game/${activeBrandSession.id}`)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Продовжити гру
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full h-7 text-xs"
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
                    toast({ title: "Помилка", description: "Не вдалося створити гру", variant: "destructive" });
                  }
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                Почати гру
              </Button>
            )}
          </div>
        </aside>
      )}
      {/* ======== MAIN CHAT AREA ======== */}
      <div className={isBrandMode ? "flex-1 flex flex-col overflow-hidden" : "flex flex-col h-full"}>
      <div className={isBrandMode ? "flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800 gap-2 shrink-0" : "flex items-center justify-between mb-3 sm:mb-4 gap-2"}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {!isBrandMode && (
            <Link href="/brand-maps">
              <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {isBrandMode && (
            <Link href="/dashboard" className="sm:hidden">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className={`font-bold text-gray-900 dark:text-white truncate ${isBrandMode ? 'text-sm sm:hidden' : 'text-base sm:text-xl'}`} data-testid="text-brand-name">
              {isBrandMode ? (brandChats.find(c => c.id === selectedBrandChatId)?.name || brand?.name || 'Бренд') : (brand?.name || 'Бренд')}
            </h1>
            {!isBrandMode && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                AI-консультант з брендингу
              </p>
            )}
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
            disabled={displayMessages.length === 0 && imageMessages.length === 0}
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
                disabled={displayMessages.length === 0 && imageMessages.length === 0}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистити чат
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className={`flex-1 flex flex-col overflow-hidden ${isBrandMode ? 'rounded-none border-0 border-t' : ''}`}>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {(isBrandMode && !selectedBrandChatId) ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center space-y-3 max-w-xs">
                <Bot className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Виберіть або створіть чат</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Натисніть "Новий чат" в лівій панелі щоб почати розмову
                </p>
                <Button size="sm" onClick={() => createBrandChatMutation.mutate()} disabled={createBrandChatMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Новий чат
                </Button>
              </div>
            </div>
          ) : (!activeSessionId && !isBrandMode) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 max-w-xs">
                <Gamepad2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Для кращого розуміння вашого бренду
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Рекомендуємо пройти гру «Душа Бренду» — AI використовуватиме ваші відповіді як контекст. Або почніть чат без гри.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
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
                      } catch {
                        toast({ title: "Помилка", description: "Не вдалося створити гру", variant: "destructive" });
                      }
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Пройти гру
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await apiRequestJson('POST', '/api/game-sessions', {
                          brandId: brandIdFromUrl,
                          currentLevel: 'soul',
                          currentCard: 'soul-start',
                          progress: 0,
                        });
                        setSelectedGameSessionId(response.id);
                      } catch {
                        toast({ title: "Помилка", description: "Не вдалося підключити чат", variant: "destructive" });
                      }
                    }}
                  >
                    Почати чат
                  </Button>
                </div>
              </div>
            </div>
          ) : displayMessages.length === 0 && imageMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-empty-chat">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Привіт! Я ваш AI-консультант</p>
              <p className="text-sm max-w-md mx-auto">
                {isBrandMode 
                  ? "Напишіть своє перше повідомлення щоб почати розмову про ваш бренд."
                  : "Я знаю всі відповіді з вашої гри \"Душа Бренду\" і готовий допомогти з питаннями про ваш бренд, стратегію, позиціонування та розвиток."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Database messages (including images with role='image') */}
              {displayMessages.map((msg: any) => {
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
                        <ImageGenerationSkeleton startedAt={imgMsg.startedAt} />
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
              
              {/* Generation settings: Pro / Resolution */}
              <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Надналаштування генерації</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300">🍌 Pro модель</span>
                  <Switch
                    id="use-pro"
                    checked={useNanoBananaPro}
                    onCheckedChange={(v) => {
                      setUseNanoBananaPro(v);
                      if (!v && nanoBananaResolution === '4K') setNanoBananaResolution('2K');
                    }}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300">🖼️ Якість</span>
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'standard', label: 'Стд' },
                      { value: '2K', label: '2K' },
                      { value: '4K', label: '4K', requiresPro: true },
                    ].map((r) => {
                      const disabled = r.requiresPro && !useNanoBananaPro;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          disabled={disabled}
                          onClick={() => setNanoBananaResolution(r.value)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            disabled
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                              : nanoBananaResolution === r.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
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
              
              {/* Logo toggle for image generation */}
              {brand?.logo && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <img 
                      src={resolveMediaUrl(brand.logo)} 
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
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Merch Dialog */}
        <Dialog open={showMerchMenu} onOpenChange={setShowMerchMenu}>
          <DialogContent className="max-w-md">
            <DialogTitle>Створити мерч</DialogTitle>
            <div className="space-y-4">
              {brand?.logo && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <img 
                    src={resolveMediaUrl(brand.logo)} 
                    alt="Brand logo" 
                    className="w-12 h-12 rounded object-contain bg-white dark:bg-gray-700 p-1"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Логотип бренду буде використано</span>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Оберіть один або декілька типів мерчу для генерації
              </p>
              <div className="grid grid-cols-2 gap-2">
                {merchTypes?.map((mt) => {
                  const isSelected = selectedMerchTypeIds.includes(mt.id);
                  return (
                    <button
                      key={mt.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMerchTypeIds(prev => prev.filter(id => id !== mt.id));
                        } else {
                          setSelectedMerchTypeIds(prev => [...prev, mt.id]);
                        }
                        setUseLogo(true);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {isSelected && <span className="text-yellow-600">✓</span>}
                      <span className="text-xl">{mt.emoji}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mt.name}</span>
                    </button>
                  );
                })}
              </div>
              {selectedMerchTypeIds.length > 0 && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Обрано: {selectedMerchTypeIds.length}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => setShowMerchMenu(false)}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Готово
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Templates Dialog */}
        <Dialog open={showTemplatesMenu} onOpenChange={setShowTemplatesMenu}>
          <DialogContent className="max-w-md">
            <DialogTitle>Шаблони генерації</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Оберіть один або декілька шаблонів для генерації
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
              {generationTemplates?.map((template) => {
                const isSelected = selectedTemplateIds.includes(template.id);
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTemplateIds(prev => prev.filter(id => id !== template.id));
                      } else {
                        setSelectedTemplateIds(prev => [...prev, template.id]);
                      }
                      setUseLogo(true);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all relative ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 right-1 text-purple-600 text-xs">✓</span>
                    )}
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
                );
              })}
            </div>
            {selectedTemplateIds.length > 0 && (
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  Обрано: {selectedTemplateIds.length}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => setShowTemplatesMenu(false)}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Готово
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Agent Selection Dialog */}
        <Dialog open={showAgentMenu} onOpenChange={setShowAgentMenu}>
          <DialogContent className="max-w-sm">
            <DialogTitle>AI Агент</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Оберіть агента для генерації контенту
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedAgentId(null);
                  setShowAgentMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                  !selectedAgentId 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Bot className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Без агента</span>
                  <span className="block text-xs text-gray-400">Стандартний AI</span>
                </div>
                {!selectedAgentId && <span className="ml-auto text-purple-600">✓</span>}
              </button>
              {userAgents?.filter(a => a.isActive).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setShowAgentMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                    selectedAgentId === agent.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Bot className="w-5 h-5 text-purple-500" />
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{agent.name}</span>
                    {agent.description && (
                      <span className="block text-xs text-gray-400 truncate">{agent.description}</span>
                    )}
                  </div>
                  {selectedAgentId === agent.id && <span className="ml-auto text-purple-600 shrink-0">✓</span>}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Selection Dialog - Multi-select with images */}
        <Dialog open={showProductMenu} onOpenChange={setShowProductMenu}>
          <DialogContent className="max-w-md">
            <DialogTitle>📦 Продукти</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Оберіть продукти для контексту генерації
            </p>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  if (allProductsSelected) {
                    setSelectedProductIds([]);
                  } else {
                    setSelectedProductIds(brandProducts?.map(p => p.id) || []);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                  allProductsSelected 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${allProductsSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {allProductsSelected && <Check className="w-3 h-3" />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Усі продукти</span>
                {brandProducts && <span className="ml-auto text-xs text-gray-400">{brandProducts.length}</span>}
              </button>
              {brandProducts?.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductIds(prev => 
                        isSelected ? prev.filter(id => id !== product.id) : [...prev, product.id]
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    {product.mainImageUrl ? (
                      <img src={resolveMediaUrl(product.mainImageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                      {product.category && (
                        <span className="block text-xs text-gray-400">{product.category}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <span className="text-xs text-gray-400">Обрано: {selectedProductIds.length} з {brandProducts?.length || 0}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedProductIds([]); setShowProductMenu(false); }}>
                  Скасувати
                </Button>
                <Button size="sm" onClick={() => setShowProductMenu(false)}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Зберегти
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Audience Selection Dialog - Multi-select with checkboxes */}
        <Dialog open={showAudienceMenu} onOpenChange={setShowAudienceMenu}>
          <DialogContent className="max-w-md">
            <DialogTitle>👥 Аудиторія</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Оберіть цільові аудиторії для контексту генерації
            </p>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  if (allAudiencesSelected) {
                    setSelectedAudienceIds([]);
                  } else {
                    setSelectedAudienceIds(brandAudiences?.map(a => a.id) || []);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                  allAudiencesSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${allAudiencesSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {allAudiencesSelected && <Check className="w-3 h-3" />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Усі аудиторії</span>
                {brandAudiences && <span className="ml-auto text-xs text-gray-400">{brandAudiences.length}</span>}
              </button>
              {brandAudiences?.map((audience) => {
                const isSelected = selectedAudienceIds.includes(audience.id);
                return (
                  <AudienceItemWithSegments
                    key={audience.id}
                    audience={audience}
                    isSelected={isSelected}
                    onSelect={() => {
                      setSelectedAudienceIds(prev => 
                        isSelected ? prev.filter(id => id !== audience.id) : [...prev, audience.id]
                      );
                    }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <span className="text-xs text-gray-400">Обрано: {selectedAudienceIds.length} з {brandAudiences?.length || 0}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedAudienceIds([]); setShowAudienceMenu(false); }}>
                  Скасувати
                </Button>
                <Button size="sm" onClick={() => setShowAudienceMenu(false)}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Зберегти
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
              
        {/* Active settings indicator */}
        {(selectedStyle || selectedMerchTypeIds.length > 0 || selectedTemplateIds.length > 0 || generationProgress) && (
          <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              {generationProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">
                    Генерація {generationProgress.current}/{generationProgress.total}
                  </span>
                </>
              ) : (
                <>
                  <Settings2 className="w-4 h-4" />
                  <span>
                    {selectedStyle && IMAGE_STYLES.find(s => s.value === selectedStyle)?.label}
                    {selectedStyle && (selectedMerchTypeIds.length > 0 || selectedTemplateIds.length > 0) && ' • '}
                    {selectedMerchTypeIds.length > 0 && `${selectedMerchTypeIds.length} мерч`}
                    {selectedMerchTypeIds.length > 0 && selectedTemplateIds.length > 0 && ' + '}
                    {selectedTemplateIds.length > 0 && `${selectedTemplateIds.length} шаблон`}
                  </span>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { 
                setSelectedStyle(''); 
                setSelectedMerchTypeIds([]); 
                setSelectedTemplateIds([]);
                setUseLogo(false);
                setGenerationProgress(null);
              }}
              className="text-xs h-6 px-2 text-purple-700 dark:text-purple-300"
            >
              Скинути
            </Button>
          </div>
        )}

        <form onSubmit={handleSend} className="p-2 border-t dark:border-gray-700 relative">
          {/* Selected context tags - Desktop only, shown only when something is selected */}
          {(selectedAgent || hasSelectedProducts || hasSelectedAudiences) && (
            <div className="hidden sm:flex mb-2 items-center gap-1.5 flex-wrap">
              {selectedAgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Bot className="w-3 h-3" />
                  {selectedAgent.name}
                  <button type="button" onClick={() => setSelectedAgentId(null)} className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {hasSelectedProducts && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  📦 {allProductsSelected ? 'Усі продукти' : `Продукти (${selectedProductIds.length})`}
                  <button type="button" onClick={() => setSelectedProductIds([])} className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {hasSelectedAudiences && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  👥 {allAudiencesSelected ? 'Усі аудиторії' : `Аудиторії (${selectedAudienceIds.length})`}
                  <button type="button" onClick={() => setSelectedAudienceIds([])} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
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
            
            {/* Selected context tags - Mobile only */}
            {(selectedAgent || hasSelectedProducts || hasSelectedAudiences) && (
              <div className="sm:hidden flex mb-1.5 items-center gap-1 flex-wrap">
                {selectedAgent && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Bot className="w-2.5 h-2.5" />
                    {selectedAgent.name}
                    <button type="button" onClick={() => setSelectedAgentId(null)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {hasSelectedProducts && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    📦 {allProductsSelected ? 'Усі' : selectedProductIds.length}
                    <button type="button" onClick={() => setSelectedProductIds([])}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {hasSelectedAudiences && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    👥 {allAudiencesSelected ? 'Усі' : selectedAudienceIds.length}
                    <button type="button" onClick={() => setSelectedAudienceIds([])}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
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
                <DropdownMenuItem onClick={() => {
                  setImageGenerationMode(!imageGenerationMode);
                  setShowImageSettings(!showImageSettings);
                }}>
                  <Palette className="w-4 h-4 mr-2" />
                  {imageGenerationMode ? '✓ ' : ''}Генерація зображень
                </DropdownMenuItem>
                {merchTypes && merchTypes.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowMerchMenu(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Створити мерч
                  </DropdownMenuItem>
                )}
                {generationTemplates && generationTemplates.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowTemplatesMenu(true)}>
                    <Image className="w-4 h-4 mr-2" />
                    Шаблони генерації
                  </DropdownMenuItem>
                )}
                {userAgents && userAgents.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowAgentMenu(true)}>
                      <Bot className="w-4 h-4 mr-2" />
                      {selectedAgent ? selectedAgent.name : 'AI Агент'}
                    </DropdownMenuItem>
                  </>
                )}
                {brandProducts && brandProducts.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowProductMenu(true)}>
                    <span className="mr-2">📦</span>
                    Продукти
                    {hasSelectedProducts && <span className="ml-auto text-xs text-amber-500">{selectedProductIds.length}</span>}
                  </DropdownMenuItem>
                )}
                {brandAudiences && brandAudiences.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowAudienceMenu(true)}>
                    <span className="mr-2">👥</span>
                    Аудиторія
                    {hasSelectedAudiences && <span className="ml-auto text-xs text-blue-500">{selectedAudienceIds.length}</span>}
                  </DropdownMenuItem>
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
                disabled={sendMessageMutation.isPending || generateImageMutation.isPending}
                className="w-full text-sm h-10 bg-transparent"
                data-testid="input-message"
              />
            </div>
            
            {/* Desktop: show settings button only (generate button is the main send button) */}
            <div className="hidden sm:flex gap-1">
              <Button
                type="button"
                variant={showImageSettings || imageGenerationMode || selectedStyle ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  setImageGenerationMode(!imageGenerationMode);
                  setShowImageSettings(!showImageSettings);
                }}
                title={imageGenerationMode ? "Режим генерації зображень" : "Налаштування генерації"}
                data-testid="button-toggle-settings"
                className={`shrink-0 w-10 h-10 ${showImageSettings || imageGenerationMode || selectedStyle ? "bg-purple-600 hover:bg-purple-700" : ""}`}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Send button - changes to image generation when settings open or merch/template selected */}
            {(showImageSettings || selectedMerchTypeIds.length > 0 || selectedTemplateIds.length > 0) ? (
              <Button 
                type="button"
                size="icon"
                onClick={handleGenerateImage}
                disabled={(!message.trim() && selectedMerchTypeIds.length === 0 && selectedTemplateIds.length === 0) || generateImageMutation.isPending || sendMessageMutation.isPending || !!generationProgress}
                className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${(selectedMerchTypeIds.length > 0 || selectedTemplateIds.length > 0) ? "bg-orange-500 hover:bg-orange-600" : "bg-purple-600 hover:bg-purple-700"}`}
                data-testid="button-send"
              >
                {generationProgress ? (
                  <span className="text-xs font-bold">{generationProgress.current}/{generationProgress.total}</span>
                ) : generateImageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <Button 
                type="submit"
                size="icon"
                disabled={!message.trim() || sendMessageMutation.isPending || generateImageMutation.isPending || (isBrandMode && !selectedBrandChatId)}
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
      </div>{/* end main chat area */}
    </div>
  );
}
