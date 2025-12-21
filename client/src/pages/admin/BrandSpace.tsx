import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  Panel,
  NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, RefreshCw, Map, Heart, Brain, Briefcase, Sparkles, ZoomIn, ZoomOut, Maximize, Save, X, Edit3, Eye, SkipForward } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface GameSession {
  id: string;
  brandId: string;
  completed: boolean;
  completedCards: string[];
  createdAt: string;
}

interface BrandMapData {
  soul: Record<string, any>;
  mind: Record<string, any>;
  body: Record<string, any>;
}

interface CardResponse {
  cardId: string;
  response: any;
  skipped: boolean;
  skipReason?: string;
}

const levelColors = {
  soul: { bg: '#ec4899', border: '#db2777', text: '#fce7f3', light: '#fdf2f8' },
  mind: { bg: '#3b82f6', border: '#2563eb', text: '#dbeafe', light: '#eff6ff' },
  body: { bg: '#22c55e', border: '#16a34a', text: '#dcfce7', light: '#f0fdf4' },
};

const cardLabels: Record<string, string> = {
  'soul-start': 'Вступ',
  'soul-values': 'Цінності',
  'soul-deep-values': 'Глибинні цінності',
  'soul-mission': 'Місія',
  'soul-impact': 'Вплив',
  'soul-story': 'Історія',
  'soul-purpose': 'Призначення',
  'soul-emotion': 'Емоції',
  'soul-archetype': 'Архетип',
  'mind-start': 'Вступ',
  'mind-target': 'Цільова аудиторія',
  'mind-audience': 'Аудиторія',
  'mind-problem': 'Проблема',
  'mind-solution': 'Рішення',
  'mind-benefit': 'Переваги',
  'mind-positioning': 'Позиціонування',
  'mind-archetype': 'Архетип',
  'mind-promise': 'Обіцянка',
  'body-start': 'Вступ',
  'body-products': 'Продукти',
  'body-channels': 'Канали',
  'body-voice': 'Голос бренду',
  'body-visual': 'Візуальний стиль',
  'body-metrics': 'Метрики',
  'body-touchpoints': 'Точки контакту',
};

function formatResponse(response: any): string {
  if (!response) return '';
  if (typeof response === 'string') return response;
  if (Array.isArray(response)) return response.join(', ');
  if (typeof response === 'object') {
    if (response.skipped) return '';
    return JSON.stringify(response, null, 2);
  }
  return String(response);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

interface CardNodeData extends Record<string, unknown> {
  label: string;
  cardId: string;
  response: any;
  isSkipped: boolean;
  skipReason?: string;
  levelId: string;
  onNodeClick: (cardId: string) => void;
}

function CardNode({ data }: NodeProps<Node<CardNodeData>>) {
  const levelColor = levelColors[data.levelId as keyof typeof levelColors] || levelColors.soul;
  const responseText = formatResponse(data.response);
  const hasContent = responseText.length > 0;
  
  return (
    <div
      onClick={() => data.onNodeClick(data.cardId)}
      className="cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
      style={{
        background: data.isSkipped ? '#fef3c7' : hasContent ? levelColor.light : '#f9fafb',
        border: `2px solid ${data.isSkipped ? '#f59e0b' : hasContent ? levelColor.border : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '12px',
        minWidth: '220px',
        maxWidth: '280px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: levelColor.border }} />
      
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-gray-800">{data.label}</span>
        {data.isSkipped ? (
          <SkipForward className="h-4 w-4 text-amber-600" />
        ) : hasContent ? (
          <Edit3 className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      {data.isSkipped ? (
        <div className="text-xs text-amber-700 italic">
          Пропущено{data.skipReason ? `: ${truncateText(data.skipReason, 50)}` : ''}
        </div>
      ) : hasContent ? (
        <div className="text-xs text-gray-600 line-clamp-3">
          {truncateText(responseText, 120)}
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic">Немає відповіді</div>
      )}
      
      <Handle type="source" position={Position.Bottom} style={{ background: levelColor.border }} />
    </div>
  );
}

function LevelNode({ data }: NodeProps<Node<{ label: string; levelId: string }>>) {
  const levelColor = levelColors[data.levelId as keyof typeof levelColors] || levelColors.soul;
  
  return (
    <div
      style={{
        background: levelColor.bg,
        color: 'white',
        border: `3px solid ${levelColor.border}`,
        borderRadius: '16px',
        padding: '16px 32px',
        fontWeight: 'bold',
        fontSize: '18px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: levelColor.border }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ background: levelColor.border }} />
      <Handle type="source" position={Position.Bottom} id="cards" style={{ background: levelColor.border }} />
    </div>
  );
}

const nodeTypes = {
  cardNode: CardNode,
  levelNode: LevelNode,
};

function generateNodesAndEdges(
  brandMap: BrandMapData, 
  responses: Record<string, any>,
  onNodeClick: (cardId: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const levelXPositions = { soul: 0, mind: 500, body: 1000 };
  
  const levels = [
    { id: 'soul', name: 'Душа', icon: '💗', data: brandMap.soul },
    { id: 'mind', name: 'Розум', icon: '🧠', data: brandMap.mind },
    { id: 'body', name: 'Тіло', icon: '💼', data: brandMap.body },
  ];
  
  levels.forEach((level, levelIndex) => {
    const x = levelXPositions[level.id as keyof typeof levelXPositions];
    
    nodes.push({
      id: `level-${level.id}`,
      type: 'levelNode',
      position: { x, y: 0 },
      data: { 
        label: `${level.icon} ${level.name}`,
        levelId: level.id,
      },
      draggable: true,
    });
    
    const levelResponses = Object.entries(responses).filter(([cardId]) => 
      cardId.startsWith(`${level.id}-`)
    );
    
    levelResponses.forEach(([cardId, responseData], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const y = 120 + row * 140;
      const xOffset = col === 0 ? -80 : 80;
      
      const isSkipped = responseData?.skipped === true;
      const response = responseData?.response;
      
      nodes.push({
        id: cardId,
        type: 'cardNode',
        position: { x: x + xOffset, y },
        data: {
          label: cardLabels[cardId] || cardId.replace(`${level.id}-`, ''),
          cardId,
          response,
          isSkipped,
          skipReason: responseData?.skipReason,
          levelId: level.id,
          onNodeClick,
        },
        draggable: true,
      });
      
      edges.push({
        id: `e-level-${level.id}-${cardId}`,
        source: `level-${level.id}`,
        sourceHandle: 'cards',
        target: cardId,
        type: 'smoothstep',
        animated: !isSkipped && !!response,
        style: { 
          stroke: levelColors[level.id as keyof typeof levelColors].border, 
          strokeWidth: 2 
        },
      });
    });
  });
  
  edges.push({
    id: 'e-soul-mind',
    source: 'level-soul',
    target: 'level-mind',
    type: 'smoothstep',
    style: { stroke: '#6b7280', strokeWidth: 3, strokeDasharray: '8,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
  });
  
  edges.push({
    id: 'e-mind-body',
    source: 'level-mind',
    target: 'level-body',
    type: 'smoothstep',
    style: { stroke: '#6b7280', strokeWidth: 3, strokeDasharray: '8,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
  });
  
  return { nodes, edges };
}

export default function BrandSpace() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ cardId: string; response: any; isSkipped: boolean; skipReason?: string } | null>(null);
  const [editedResponse, setEditedResponse] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['/api/admin/brands'],
  });
  
  const { data: sessions, isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/admin/brand-sessions', selectedBrandId],
    enabled: !!selectedBrandId,
  });
  
  const { data: brandMap, isLoading: mapLoading } = useQuery<BrandMapData>({
    queryKey: ['/api/game-sessions', selectedSessionId, 'brand-map'],
    enabled: !!selectedSessionId,
  });
  
  const { data: responsesMap, refetch: refetchResponses } = useQuery<Record<string, any>>({
    queryKey: ['/api/game-sessions', selectedSessionId, 'responses-map'],
    enabled: !!selectedSessionId,
  });
  
  const handleNodeClick = useCallback((cardId: string) => {
    if (!responsesMap) return;
    const responseData = responsesMap[cardId];
    setSelectedCard({
      cardId,
      response: responseData?.response,
      isSkipped: responseData?.skipped || false,
      skipReason: responseData?.skipReason,
    });
    setEditedResponse(formatResponse(responseData?.response));
    setIsEditing(false);
  }, [responsesMap]);
  
  const { nodes: generatedNodes, edges: generatedEdges } = useMemo(() => {
    if (!brandMap || !responsesMap) {
      return { nodes: [], edges: [] };
    }
    return generateNodesAndEdges(brandMap, responsesMap, handleNodeClick);
  }, [brandMap, responsesMap, handleNodeClick]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);
  
  useEffect(() => {
    if (generatedNodes.length > 0) {
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    }
  }, [generatedNodes, generatedEdges, setNodes, setEdges]);
  
  const updateResponseMutation = useMutation({
    mutationFn: async ({ sessionId, cardId, response }: { sessionId: string; cardId: string; response: string }) => {
      return apiRequest('PATCH', `/api/admin/card-responses/${sessionId}/${cardId}`, { response });
    },
    onSuccess: () => {
      toast({ title: 'Збережено', description: 'Відповідь успішно оновлено' });
      refetchResponses();
      setSelectedCard(null);
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Помилка', description: 'Не вдалося зберегти відповідь', variant: 'destructive' });
    },
  });
  
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedSessionId(null);
  };
  
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  const handleSaveResponse = () => {
    if (!selectedSessionId || !selectedCard) return;
    updateResponseMutation.mutate({
      sessionId: selectedSessionId,
      cardId: selectedCard.cardId,
      response: editedResponse,
    });
  };
  
  const filteredSessions = sessions?.filter(s => s.brandId === selectedBrandId && s.completed) || [];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Map className="h-8 w-8 text-purple-400" />
              Простір Бренду
            </h1>
            <p className="text-gray-400 mt-2">Візуалізація карти бренду та зв'язків</p>
          </div>
          <Link href="/rcadmin">
            <Button variant="outline" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Вибір Бренду
            </CardTitle>
            <CardDescription className="text-gray-400">
              Оберіть бренд та завершену сесію для візуалізації
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-64">
                <label className="text-sm text-gray-400 mb-2 block">Бренд</label>
                <Select value={selectedBrandId || ''} onValueChange={handleBrandSelect}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Оберіть бренд" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {brands?.map(brand => (
                      <SelectItem key={brand.id} value={brand.id} className="text-white hover:bg-gray-600">
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedBrandId && (
                <div className="w-64">
                  <label className="text-sm text-gray-400 mb-2 block">Завершена сесія</label>
                  <Select value={selectedSessionId || ''} onValueChange={handleSessionSelect}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Оберіть сесію" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {filteredSessions.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400 text-sm">Немає завершених сесій</div>
                      ) : (
                        filteredSessions.map(session => (
                          <SelectItem key={session.id} value={session.id} className="text-white hover:bg-gray-600">
                            {new Date(session.createdAt).toLocaleDateString('uk-UA')} ✓
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <div style={{ height: '700px', width: '100%' }}>
              {selectedSessionId && brandMap ? (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.3}
                  maxZoom={2}
                  attributionPosition="bottom-left"
                  style={{ background: '#1f2937' }}
                  panOnScroll
                  selectionOnDrag
                  panOnDrag={[1, 2]}
                  selectNodesOnDrag={false}
                >
                  <Controls 
                    className="bg-gray-700 border-gray-600 rounded-lg overflow-hidden"
                    showInteractive={false}
                  />
                  <MiniMap 
                    nodeStrokeColor={(n) => {
                      if (n.id.includes('soul')) return levelColors.soul.border;
                      if (n.id.includes('mind')) return levelColors.mind.border;
                      if (n.id.includes('body')) return levelColors.body.border;
                      return '#6b7280';
                    }}
                    nodeColor={(n) => {
                      if (n.id.includes('soul')) return levelColors.soul.bg;
                      if (n.id.includes('mind')) return levelColors.mind.bg;
                      if (n.id.includes('body')) return levelColors.body.bg;
                      return '#6b7280';
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-lg"
                    maskColor="rgba(31, 41, 55, 0.8)"
                  />
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
                  
                  <Panel position="top-right" className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>🖱️ Перетягуйте блоки для переміщення</div>
                      <div>🔍 Колесо миші для масштабування</div>
                      <div>👆 Клікніть на картку для деталей</div>
                    </div>
                  </Panel>
                </ReactFlow>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Оберіть бренд та завершену сесію для відображення карти</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: levelColors.soul.bg }}></div>
            <span className="text-gray-400">Душа — цінності, місія, історія</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: levelColors.mind.bg }}></div>
            <span className="text-gray-400">Розум — стратегія, аудиторія</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: levelColors.body.bg }}></div>
            <span className="text-gray-400">Тіло — продукти, канали</span>
          </div>
        </div>
      </div>
      
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              {selectedCard && (cardLabels[selectedCard.cardId] || selectedCard.cardId)}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCard?.isSkipped 
                ? 'Ця картка була пропущена користувачем'
                : 'Перегляд та редагування відповіді на картку'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCard?.isSkipped ? (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <SkipForward className="h-5 w-5" />
                <span className="font-medium">Пропущено</span>
              </div>
              {selectedCard.skipReason && (
                <p className="text-gray-300 text-sm">{selectedCard.skipReason}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Відповідь</Label>
                {isEditing ? (
                  <Textarea
                    value={editedResponse}
                    onChange={(e) => setEditedResponse(e.target.value)}
                    className="mt-2 bg-gray-700 border-gray-600 text-white min-h-[200px]"
                    placeholder="Введіть відповідь..."
                  />
                ) : (
                  <div className="mt-2 bg-gray-700 border border-gray-600 rounded-md p-4 min-h-[100px] whitespace-pre-wrap">
                    {formatResponse(selectedCard?.response) || <span className="text-gray-500 italic">Немає відповіді</span>}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {!selectedCard?.isSkipped && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Скасувати
                    </Button>
                    <Button 
                      onClick={handleSaveResponse}
                      disabled={updateResponseMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateResponseMutation.isPending ? 'Збереження...' : 'Зберегти'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                )}
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => setSelectedCard(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
