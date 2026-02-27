import { useState, useLayoutEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Globe,
  Shield,
  BarChart3,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Languages,
  History,
  Trash2,
  Plus,
  Search,
  Building2,
} from 'lucide-react';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { CreateBrandDialog } from '@/components/brands/CreateBrandDialog';
import type { UserBrand } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BrandNameSession, BrandNameResult } from '@shared/schema';

const MAX_FAVORITES = 5;

interface SessionWithResults {
  session: BrandNameSession;
  results: BrandNameResult[];
}

export default function NameGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [localResults, setLocalResults] = useState<BrandNameResult[]>([]);

  const [niche, setNiche] = useState('');
  const [values, setValues] = useState('');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [language, setLanguage] = useState('uk');
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  const [createBrandDefaults, setCreateBrandDefaults] = useState<{ name?: string; description?: string }>({});

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<BrandNameSession[]>({
    queryKey: ['/api/name-generator/sessions'],
    enabled: !!user,
  });

  const { data: loadedSession, isLoading: sessionLoading } = useQuery<SessionWithResults>({
    queryKey: ['/api/name-generator/sessions', activeSessionId],
    enabled: !!activeSessionId && localResults.length === 0,
  });

  const displayResults = localResults.length > 0 ? localResults : (loadedSession?.results || []);
  const currentSession = localResults.length > 0 
    ? sessions.find(s => s.id === activeSessionId) || loadedSession?.session 
    : loadedSession?.session;
  const isAnalyzed = currentSession?.status === 'completed' || displayResults.some(r => r.overallScore != null);
  const favoritedCount = displayResults.filter(r => r.isFavorite).length;

  const generateMutation = useMutation({
    mutationFn: async (brief: {
      niche: string;
      values: string;
      tone: string;
      targetAudience: string;
      keywords: string;
      language: string;
    }) => {
      const res = await apiRequest('POST', '/api/name-generator/generate', brief);
      return res.json();
    },
    onSuccess: (data: { session: BrandNameSession; results: BrandNameResult[] }) => {
      setActiveSessionId(data.session.id);
      setLocalResults(data.results);
      queryClient.invalidateQueries({ queryKey: ['/api/name-generator/sessions'] });
      toast({ title: 'Готово!', description: `Згенеровано ${data.results?.length || 0} назв` });
    },
    onError: (error: Error) => {
      toast({ title: 'Помилка генерації', description: error.message, variant: 'destructive' });
    },
  });

  const generateMoreMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      setLocalResults(prev => prev.filter(r => r.isFavorite));
      const res = await apiRequest('POST', `/api/name-generator/generate-more/${sessionId}`);
      return res.json();
    },
    onSuccess: (data: { results: BrandNameResult[] }) => {
      setLocalResults(prev => [...prev, ...data.results]);
      toast({ title: 'Додано!', description: `Ще ${data.results?.length || 0} назв` });
    },
    onError: (error: Error) => {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest('POST', `/api/name-generator/analyze/${sessionId}`);
      return res.json();
    },
    onSuccess: (data: { session: BrandNameSession; results: BrandNameResult[] }) => {
      setLocalResults(data.results);
      queryClient.invalidateQueries({ queryKey: ['/api/name-generator/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/name-generator/sessions', activeSessionId] });
      toast({ title: 'Аналіз завершено!', description: 'Обрані назви проаналізовано' });
    },
    onError: (error: Error) => {
      toast({ title: 'Помилка аналізу', description: error.message, variant: 'destructive' });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ resultId, isFavorite }: { resultId: string; isFavorite: boolean }) => {
      const res = await apiRequest('PATCH', `/api/name-generator/results/${resultId}/favorite`, { isFavorite });
      return res.json();
    },
    onSuccess: (updated: BrandNameResult) => {
      setLocalResults(prev => prev.map(r => r.id === updated.id ? { ...r, isFavorite: updated.isFavorite } : r));
      if (activeSessionId) {
        queryClient.invalidateQueries({ queryKey: ['/api/name-generator/sessions', activeSessionId] });
      }
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest('DELETE', `/api/name-generator/sessions/${sessionId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/name-generator/sessions'] });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
        setLocalResults([]);
      }
      toast({ title: 'Видалено', description: 'Сесію генерації видалено' });
    },
  });

  const handleGenerate = () => {
    if (!niche.trim()) {
      toast({ title: 'Заповніть поле', description: 'Вкажіть нішу/сферу діяльності', variant: 'destructive' });
      return;
    }
    generateMutation.mutate({ niche, values, tone, targetAudience, keywords, language });
  };

  const handleToggleFavorite = (result: BrandNameResult) => {
    if (!result.isFavorite && favoritedCount >= MAX_FAVORITES) {
      toast({ title: 'Максимум обраних', description: `Можна обрати не більше ${MAX_FAVORITES} назв`, variant: 'destructive' });
      return;
    }
    favoriteMutation.mutate({ resultId: result.id, isFavorite: !result.isFavorite });
  };

  const handleLoadSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setLocalResults([]);
    setShowHistory(false);
  };

  const handleNewGeneration = () => {
    setActiveSessionId(null);
    setLocalResults([]);
  };

  const handleCreateBrand = (result: BrandNameResult) => {
    const sessionNiche = loadedSession?.session?.niche || niche;
    const sessionValues = loadedSession?.session?.values || values;
    const sessionTone = loadedSession?.session?.tone || tone;
    const descParts: string[] = [];
    if (result.explanation) descParts.push(result.explanation);
    if (sessionNiche) descParts.push(`Ніша: ${sessionNiche}`);
    if (sessionValues) descParts.push(`Цінності: ${sessionValues}`);
    if (sessionTone) descParts.push(`Тон: ${sessionTone}`);
    setCreateBrandDefaults({
      name: result.name,
      description: descParts.join('\n'),
    });
    setCreateBrandOpen(true);
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRiskLabel = (risk: string | null) => {
    switch (risk) {
      case 'low': return 'Низький';
      case 'medium': return 'Середній';
      case 'high': return 'Високий';
      default: return '—';
    }
  };

  const isFirstGenerating = generateMutation.isPending;
  const isGeneratingMore = generateMoreMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;
  const showForm = !activeSessionId && !isFirstGenerating;
  const showResults = activeSessionId && displayResults.length > 0;

  const favoritedResults = displayResults.filter(r => r.isFavorite);
  const nonFavoritedResults = displayResults.filter(r => !r.isFavorite);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900/20 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-500" />
              Генератор назв
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              AI допоможе знайти ідеальну назву для вашого бренду
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="shrink-0 gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Історія</span>
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">{sessions.length}</Badge>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            {/* Brief Form */}
            {showForm && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Бриф для генерації</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Ніша / Сфера діяльності *</Label>
                    <Textarea
                      value={niche}
                      onChange={e => setNiche(e.target.value)}
                      placeholder="Наприклад: органічна косметика, IT-консалтинг, дитячий одяг..."
                      className="mt-1.5 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Цінності та характеристики</Label>
                    <Textarea
                      value={values}
                      onChange={e => setValues(e.target.value)}
                      placeholder="Якість, інновації, екологічність, доступність..."
                      className="mt-1.5 min-h-[60px]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Тон комунікації</Label>
                      <Input
                        value={tone}
                        onChange={e => setTone(e.target.value)}
                        placeholder="Дружній, професійний, грайливий..."
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Цільова аудиторія</Label>
                      <Input
                        value={targetAudience}
                        onChange={e => setTargetAudience(e.target.value)}
                        placeholder="Жінки 25-45, підприємці..."
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Ключові слова</Label>
                    <Input
                      value={keywords}
                      onChange={e => setKeywords(e.target.value)}
                      placeholder="Слова для натхнення, корені, асоціації..."
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Мова генерації
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1.5 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uk">Українська</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!niche.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-12 text-base"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Згенерувати 10 назв
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Initial loading state */}
            {isFirstGenerating && (
              <Card>
                <CardContent className="py-16 text-center">
                  <BrandSoulSpinner size={64} className="mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Генеруємо назви...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    AI створює варіанти на основі вашого брифу
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analyzing state */}
            {isAnalyzing && (
              <Card>
                <CardContent className="py-16 text-center">
                  <BrandSoulSpinner size={64} className="mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Аналізуємо обрані назви...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Перевіряємо домени, соцмережі, торгову марку та лінгвістичний аналіз. Це може зайняти до хвилини.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {(showResults || isGeneratingMore) && !isFirstGenerating && !isAnalyzing && (
              <div className="space-y-4">
                {/* Top bar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleNewGeneration} className="gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      Нова генерація
                    </Button>
                    <span className="text-sm text-gray-500">
                      {displayResults.length} назв
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                      {favoritedCount}/{MAX_FAVORITES}
                    </Badge>
                    {isAnalyzed && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Проаналізовано
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {!isAnalyzed && (
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => activeSessionId && generateMoreMutation.mutate(activeSessionId)}
                      disabled={isGeneratingMore}
                      className="gap-2"
                    >
                      {isGeneratingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Ще 10 назв
                    </Button>
                    <Button
                      onClick={() => activeSessionId && analyzeMutation.mutate(activeSessionId)}
                      disabled={favoritedCount === 0 || analyzeMutation.isPending || isGeneratingMore}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Search className="w-4 h-4" />
                      Аналізувати обрані ({favoritedCount})
                    </Button>
                  </div>
                )}

                {/* Favorites section (pinned at top) */}
                {favoritedResults.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-red-500" />
                      Обрані ({favoritedResults.length})
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <AnimatePresence mode="popLayout">
                        {favoritedResults.map((result) => (
                          <motion.div
                            key={result.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85, y: -10 }}
                            transition={{ duration: 0.25 }}
                          >
                            <NameCard
                              result={result}
                              isAnalyzed={isAnalyzed}
                              onToggleFavorite={() => handleToggleFavorite(result)}
                              onCreateBrand={isAnalyzed ? () => handleCreateBrand(result) : undefined}
                              getRiskColor={getRiskColor}
                              getRiskLabel={getRiskLabel}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Loading more indicator */}
                {isGeneratingMore && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <BrandSoulSpinner size={32} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Генеруємо ще назви...</p>
                  </div>
                )}

                {/* Non-favorited names */}
                {nonFavoritedResults.length > 0 && (
                  <div>
                    {favoritedResults.length > 0 && (
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        Варіанти
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <AnimatePresence mode="popLayout">
                        {nonFavoritedResults.map((result) => (
                          <motion.div
                            key={result.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <NameCard
                              result={result}
                              isAnalyzed={isAnalyzed}
                              onToggleFavorite={() => handleToggleFavorite(result)}
                              getRiskColor={getRiskColor}
                              getRiskLabel={getRiskLabel}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History sidebar */}
          {showHistory && (
            <div className="lg:block">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Історія генерацій
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {sessionsLoading ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Ще немає генерацій</p>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                          activeSessionId === session.id
                            ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700'
                            : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleLoadSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {session.niche}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(session.createdAt).toLocaleDateString('uk')} · {session.language === 'uk' ? 'UA' : 'EN'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${
                              session.status === 'completed'
                                ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                                : session.status === 'error'
                                ? 'border-red-300 text-red-700'
                                : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300'
                            }`}>
                              {session.status === 'completed' ? 'Аналіз' : session.status === 'error' ? 'Помилка' : 'Підбір'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Видалити цю генерацію?')) {
                                  deleteSessionMutation.mutate(session.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CreateBrandDialog
        open={createBrandOpen}
        onOpenChange={setCreateBrandOpen}
        defaultValues={createBrandDefaults}
        onBrandCreated={(brand: UserBrand) => {
          setCreateBrandOpen(false);
          toast({ title: 'Бренд створено!', description: `"${brand.name}" додано до ваших брендів` });
          navigate(`/brand-edit/${brand.id}`);
        }}
      />
    </div>
  );
}

function NameCard({
  result,
  isAnalyzed,
  onToggleFavorite,
  onCreateBrand,
  getRiskColor,
  getRiskLabel,
}: {
  result: BrandNameResult;
  isAnalyzed: boolean;
  onToggleFavorite: () => void;
  onCreateBrand?: () => void;
  getRiskColor: (risk: string | null) => string;
  getRiskLabel: (risk: string | null) => string;
}) {
  const domains = result.domainAvailable as Record<string, boolean> | null;
  const socials = result.socialAvailable as Record<string, boolean> | null;
  const hasAnalysis = result.overallScore != null;

  return (
    <Card className={`overflow-hidden transition-all ${
      result.isFavorite 
        ? 'ring-2 ring-red-300 dark:ring-red-700 shadow-md' 
        : 'hover:shadow-md'
    } ${isAnalyzed && !result.isFavorite ? 'opacity-50' : ''}`}>
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {result.name}
            </h3>
            {hasAnalysis && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {result.overallScore}/100
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className="shrink-0 -mt-1 -mr-2"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                result.isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-300 hover:text-red-400'
              }`}
            />
          </Button>
        </div>

        {result.explanation && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {result.explanation}
          </p>
        )}

        {/* Analysis details only show after analyze step */}
        {hasAnalysis && (
          <>
            {domains && Object.keys(domains).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Домени
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(domains).map(([domain, available]) => (
                    <Badge
                      key={domain}
                      variant="outline"
                      className={`text-[11px] px-1.5 py-0 ${
                        available
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {available ? '✓' : '✗'} {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {socials && Object.keys(socials).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Соцмережі</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(socials).map(([platform, available]) => (
                    <Badge
                      key={platform}
                      variant="outline"
                      className={`text-[11px] px-1.5 py-0 ${
                        available
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {available ? '✓' : '✗'} {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {result.trademarkRisk && (
                <Badge className={`text-[11px] px-2 py-0.5 gap-1 ${getRiskColor(result.trademarkRisk)}`}>
                  <Shield className="w-3 h-3" />
                  ТМ: {getRiskLabel(result.trademarkRisk)}
                </Badge>
              )}

              {result.linguisticScore != null && (
                <div className="flex items-center gap-2 flex-1">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <Progress value={result.linguisticScore * 10} className="h-1.5" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">{result.linguisticScore}/10</span>
                </div>
              )}
            </div>

            {result.trademarkNotes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{result.trademarkNotes}</p>
            )}
            {result.linguisticNotes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{result.linguisticNotes}</p>
            )}

            {onCreateBrand && result.isFavorite && (
              <Button
                size="sm"
                onClick={onCreateBrand}
                className="w-full mt-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <Building2 className="w-4 h-4" />
                Створити бренд
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
