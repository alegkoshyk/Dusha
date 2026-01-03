import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  Loader2, 
  Heart, 
  Brain, 
  Dumbbell, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  History,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  RefreshCw
} from "lucide-react";
import type { ExternalBrandAnalysis } from "@shared/schema";

interface SoulAnalysis {
  purpose?: string;
  mission?: string;
  values?: string[];
  story?: string;
  score?: number;
}

interface MindAnalysis {
  positioning?: string;
  audience?: string;
  communication?: string;
  message?: string;
  score?: number;
}

interface BodyAnalysis {
  visual?: string;
  colors?: string[];
  typography?: string;
  style?: string;
  score?: number;
}

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4" />;
    case 'linkedin':
      return <Linkedin className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Завершено</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Обробка</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Помилка</Badge>;
    default:
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20"><Clock className="h-3 w-3 mr-1" /> Очікування</Badge>;
  }
}

function ScoreCircle({ score, label, icon: Icon, color }: { score: number; label: string; icon: any; color: string }) {
  const colorClasses: Record<string, string> = {
    pink: 'text-pink-500 border-pink-500/30 bg-pink-500/10',
    purple: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
    blue: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
        <span className="absolute -bottom-1 text-sm font-bold bg-background px-2 rounded">{score}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function AnalysisDetail({ analysis }: { analysis: ExternalBrandAnalysis }) {
  const soul = analysis.soulAnalysis as SoulAnalysis | null;
  const mind = analysis.mindAnalysis as MindAnalysis | null;
  const body = analysis.bodyAnalysis as BodyAnalysis | null;
  const strengths = (analysis.strengths as string[]) || [];
  const weaknesses = (analysis.weaknesses as string[]) || [];
  const recommendations = (analysis.recommendations as string[]) || [];

  if (analysis.status !== 'completed') {
    return (
      <div className="text-center py-12">
        {analysis.status === 'processing' ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Аналізуємо бренд...</p>
            <p className="text-sm text-muted-foreground mt-2">Це може зайняти до хвилини</p>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-500">Помилка аналізу</p>
            <p className="text-sm text-muted-foreground mt-2">{analysis.errorMessage}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with scores */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{analysis.brandName || 'Бренд'}</h2>
        <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
          {analysis.url} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Overall scores */}
      <div className="flex justify-center gap-8 py-4">
        <ScoreCircle score={soul?.score || 0} label="Душа" icon={Heart} color="pink" />
        <ScoreCircle score={mind?.score || 0} label="Розум" icon={Brain} color="purple" />
        <ScoreCircle score={body?.score || 0} label="Тіло" icon={Dumbbell} color="blue" />
      </div>

      {/* Balance bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Загальний бал</span>
          <span className="font-bold">{analysis.overallScore}/100</span>
        </div>
        <Progress value={analysis.overallScore || 0} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Баланс компонентів</span>
          <span className="font-bold">{analysis.balanceScore}/100</span>
        </div>
        <Progress value={analysis.balanceScore || 0} className="h-2" />
      </div>

      {/* Summary */}
      {analysis.summary && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-sm">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Detailed analysis tabs */}
      <Tabs defaultValue="soul" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soul" className="flex items-center gap-1">
            <Heart className="h-4 w-4" /> Душа
          </TabsTrigger>
          <TabsTrigger value="mind" className="flex items-center gap-1">
            <Brain className="h-4 w-4" /> Розум
          </TabsTrigger>
          <TabsTrigger value="body" className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" /> Тіло
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soul" className="space-y-4 mt-4">
          {soul && (
            <>
              {soul.purpose && (
                <div>
                  <h4 className="font-semibold text-pink-500 mb-1">Призначення</h4>
                  <p className="text-sm text-muted-foreground">{soul.purpose}</p>
                </div>
              )}
              {soul.mission && (
                <div>
                  <h4 className="font-semibold text-pink-500 mb-1">Місія</h4>
                  <p className="text-sm text-muted-foreground">{soul.mission}</p>
                </div>
              )}
              {soul.values && soul.values.length > 0 && (
                <div>
                  <h4 className="font-semibold text-pink-500 mb-1">Цінності</h4>
                  <div className="flex flex-wrap gap-2">
                    {soul.values.map((v, i) => (
                      <Badge key={i} variant="secondary">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {soul.story && (
                <div>
                  <h4 className="font-semibold text-pink-500 mb-1">Історія</h4>
                  <p className="text-sm text-muted-foreground">{soul.story}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="mind" className="space-y-4 mt-4">
          {mind && (
            <>
              {mind.positioning && (
                <div>
                  <h4 className="font-semibold text-purple-500 mb-1">Позиціонування</h4>
                  <p className="text-sm text-muted-foreground">{mind.positioning}</p>
                </div>
              )}
              {mind.audience && (
                <div>
                  <h4 className="font-semibold text-purple-500 mb-1">Цільова аудиторія</h4>
                  <p className="text-sm text-muted-foreground">{mind.audience}</p>
                </div>
              )}
              {mind.communication && (
                <div>
                  <h4 className="font-semibold text-purple-500 mb-1">Стиль комунікації</h4>
                  <p className="text-sm text-muted-foreground">{mind.communication}</p>
                </div>
              )}
              {mind.message && (
                <div>
                  <h4 className="font-semibold text-purple-500 mb-1">Ключове повідомлення</h4>
                  <p className="text-sm text-muted-foreground">{mind.message}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="body" className="space-y-4 mt-4">
          {body && (
            <>
              {body.visual && (
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Візуальний стиль</h4>
                  <p className="text-sm text-muted-foreground">{body.visual}</p>
                </div>
              )}
              {body.colors && body.colors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Кольори</h4>
                  <div className="flex flex-wrap gap-2">
                    {body.colors.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {body.typography && (
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Типографіка</h4>
                  <p className="text-sm text-muted-foreground">{body.typography}</p>
                </div>
              )}
              {body.style && (
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Загальний стиль</h4>
                  <p className="text-sm text-muted-foreground">{body.style}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Strengths, Weaknesses, Recommendations */}
      <div className="grid md:grid-cols-3 gap-4">
        {strengths.length > 0 && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" /> Сильні сторони
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-500 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {weaknesses.length > 0 && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" /> Слабкі сторони
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="h-3 w-3 mt-1 text-red-500 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {recommendations.length > 0 && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                <Sparkles className="h-4 w-4" /> Рекомендації
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles className="h-3 w-3 mt-1 text-blue-500 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default function BrandAnalysisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ExternalBrandAnalysis | null>(null);

  const { data: analyses = [], isLoading, refetch } = useQuery<ExternalBrandAnalysis[]>({
    queryKey: ['/api/brand-analysis'],
    enabled: !!user,
    refetchInterval: (query) => {
      const data = query.state.data as ExternalBrandAnalysis[] | undefined;
      const hasProcessing = data?.some(a => a.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (analysisUrl: string) => {
      const res = await apiRequest('POST', '/api/brand-analysis', { url: analysisUrl });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-analysis'] });
      setSelectedAnalysis(data);
      setUrl("");
      toast({
        title: "Аналіз розпочато",
        description: "Ми аналізуємо бренд. Це може зайняти до хвилини.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити аналіз",
        variant: "destructive",
      });
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/brand-analysis/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-analysis'] });
      if (selectedAnalysis) {
        setSelectedAnalysis(null);
      }
      toast({
        title: "Видалено",
        description: "Аналіз успішно видалено",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setUrlError("URL обов'язковий");
      return;
    }
    
    if (!isValidUrl(trimmedUrl)) {
      setUrlError("Невірний формат URL");
      return;
    }
    
    setUrlError(null);
    createAnalysisMutation.mutate(trimmedUrl);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (urlError) setUrlError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left sidebar - History and input */}
          <div className="lg:col-span-1 space-y-6">
            {/* URL Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Аналіз бренду
                </CardTitle>
                <CardDescription>
                  Вставте посилання на сайт, Instagram чи іншу сторінку бренду для аналізу за методологією "Душа Бренду"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com або Instagram URL"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={urlError ? "border-red-500" : ""}
                      data-testid="input-brand-url"
                    />
                    {urlError && (
                      <p className="text-sm text-red-500">{urlError}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createAnalysisMutation.isPending || !url.trim()}
                    data-testid="button-analyze-brand"
                  >
                    {createAnalysisMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Аналізуємо...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Проаналізувати</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* History Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Історія аналізів
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => refetch()}
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : analyses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Немає аналізів</p>
                      <p className="text-xs">Вставте URL вище, щоб почати</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedAnalysis?.id === analysis.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedAnalysis(analysis)}
                          data-testid={`analysis-item-${analysis.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {getSourceIcon(analysis.sourceType)}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {analysis.brandName || new URL(analysis.url).hostname}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {new Date(analysis.createdAt).toLocaleDateString('uk-UA')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {getStatusBadge(analysis.status)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAnalysisMutation.mutate(analysis.id);
                                }}
                                data-testid={`button-delete-analysis-${analysis.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                              </Button>
                            </div>
                          </div>
                          {analysis.status === 'completed' && analysis.overallScore && (
                            <div className="mt-2 flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                Бал: {analysis.overallScore}/100
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right content - Analysis details */}
          <div className="lg:col-span-2">
            <Card className="h-full min-h-[600px]">
              <CardContent className="p-6">
                {selectedAnalysis ? (
                  <AnalysisDetail analysis={selectedAnalysis} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Аналіз за методологією "Душа Бренду"</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Вставте посилання на сайт або соціальну мережу бренду, щоб отримати глибокий аналіз за трьома вимірами: Душа, Розум та Тіло.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto">
                          <Heart className="h-6 w-6 text-pink-500" />
                        </div>
                        <p className="text-sm font-medium">Душа</p>
                        <p className="text-xs text-muted-foreground">Чому бренд існує</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                          <Brain className="h-6 w-6 text-purple-500" />
                        </div>
                        <p className="text-sm font-medium">Розум</p>
                        <p className="text-xs text-muted-foreground">Що і як комунікує</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                          <Dumbbell className="h-6 w-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium">Тіло</p>
                        <p className="text-xs text-muted-foreground">Як виглядає</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
