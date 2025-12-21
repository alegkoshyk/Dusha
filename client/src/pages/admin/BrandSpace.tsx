import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, Map, Heart, Brain, Briefcase, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

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

const levelColors = {
  soul: { bg: '#ec4899', border: '#db2777', text: '#fce7f3' },
  mind: { bg: '#3b82f6', border: '#2563eb', text: '#dbeafe' },
  body: { bg: '#22c55e', border: '#16a34a', text: '#dcfce7' },
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
  if (!response) return 'Не заповнено';
  if (typeof response === 'string') return response.length > 100 ? response.substring(0, 100) + '...' : response;
  if (Array.isArray(response)) return response.slice(0, 3).join(', ') + (response.length > 3 ? '...' : '');
  if (typeof response === 'object') {
    if (response.skipped) return '⏭️ Пропущено';
    return JSON.stringify(response).substring(0, 100) + '...';
  }
  return String(response);
}

function generateNodesAndEdges(brandMap: BrandMapData, responses: Record<string, any>): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const levelXPositions = { soul: 0, mind: 400, body: 800 };
  
  const levels = [
    { id: 'soul', name: 'Душа', icon: '💗', data: brandMap.soul },
    { id: 'mind', name: 'Розум', icon: '🧠', data: brandMap.mind },
    { id: 'body', name: 'Тіло', icon: '💼', data: brandMap.body },
  ];
  
  levels.forEach((level, levelIndex) => {
    const x = levelXPositions[level.id as keyof typeof levelXPositions];
    const levelColor = levelColors[level.id as keyof typeof levelColors];
    
    nodes.push({
      id: `level-${level.id}`,
      type: 'default',
      position: { x, y: 0 },
      data: { 
        label: `${level.icon} ${level.name}`,
      },
      style: {
        background: levelColor.bg,
        color: 'white',
        border: `2px solid ${levelColor.border}`,
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: 'bold',
        fontSize: '16px',
        minWidth: '120px',
        textAlign: 'center' as const,
      },
    });
    
    const levelResponses = Object.entries(responses).filter(([cardId]) => 
      cardId.startsWith(`${level.id}-`)
    );
    
    levelResponses.forEach(([cardId, responseData], index) => {
      const y = 100 + index * 90;
      const isSkipped = responseData?.skipped === true;
      const hasResponse = responseData?.response && !isSkipped;
      
      nodes.push({
        id: cardId,
        type: 'default',
        position: { x: x - 40, y },
        data: {
          label: cardLabels[cardId] || cardId.replace(`${level.id}-`, ''),
        },
        style: {
          background: isSkipped ? '#fef3c7' : hasResponse ? levelColor.text : '#f3f4f6',
          color: isSkipped ? '#92400e' : '#1f2937',
          border: `2px solid ${isSkipped ? '#f59e0b' : hasResponse ? levelColor.border : '#d1d5db'}`,
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          minWidth: '160px',
          textAlign: 'center' as const,
        },
      });
      
      edges.push({
        id: `e-level-${level.id}-${cardId}`,
        source: `level-${level.id}`,
        target: cardId,
        type: 'smoothstep',
        animated: hasResponse,
        style: { stroke: levelColor.border, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: levelColor.border },
      });
    });
  });
  
  edges.push({
    id: 'e-soul-mind',
    source: 'level-soul',
    target: 'level-mind',
    type: 'smoothstep',
    style: { stroke: '#6b7280', strokeWidth: 3, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
  });
  
  edges.push({
    id: 'e-mind-body',
    source: 'level-mind',
    target: 'level-body',
    type: 'smoothstep',
    style: { stroke: '#6b7280', strokeWidth: 3, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
  });
  
  return { nodes, edges };
}

export default function BrandSpace() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['/api/admin/brands'],
  });
  
  const { data: sessions, isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: [`/api/admin/brand-sessions/${selectedBrandId}`],
    enabled: !!selectedBrandId,
  });
  
  const { data: brandMap, isLoading: mapLoading } = useQuery<BrandMapData>({
    queryKey: [`/api/game-sessions/${selectedSessionId}/brand-map`],
    enabled: !!selectedSessionId,
  });
  
  const { data: responsesMap } = useQuery<Record<string, any>>({
    queryKey: [`/api/game-sessions/${selectedSessionId}/responses-map`],
    enabled: !!selectedSessionId,
  });
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!brandMap || !responsesMap) {
      return { nodes: [], edges: [] };
    }
    return generateNodesAndEdges(brandMap, responsesMap);
  }, [brandMap, responsesMap]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedSessionId(null);
  };
  
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  const filteredSessions = sessions?.filter(s => s.brandId === selectedBrandId) || [];
  
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
              Оберіть бренд та сесію для візуалізації
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
                  <label className="text-sm text-gray-400 mb-2 block">Сесія</label>
                  <Select value={selectedSessionId || ''} onValueChange={handleSessionSelect}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Оберіть сесію" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {filteredSessions.map(session => (
                        <SelectItem key={session.id} value={session.id} className="text-white hover:bg-gray-600">
                          {new Date(session.createdAt).toLocaleDateString('uk-UA')}
                          {session.completed && ' ✓'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <div style={{ height: '600px', width: '100%' }}>
              {selectedSessionId && brandMap ? (
                <ReactFlow
                  nodes={initialNodes}
                  edges={initialEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  attributionPosition="bottom-left"
                  style={{ background: '#1f2937' }}
                >
                  <Controls className="bg-gray-700 border-gray-600" />
                  <MiniMap 
                    nodeStrokeColor={(n) => {
                      if (n.id.startsWith('level-soul')) return levelColors.soul.border;
                      if (n.id.startsWith('level-mind')) return levelColors.mind.border;
                      if (n.id.startsWith('level-body')) return levelColors.body.border;
                      if (n.id.startsWith('soul-')) return levelColors.soul.border;
                      if (n.id.startsWith('mind-')) return levelColors.mind.border;
                      if (n.id.startsWith('body-')) return levelColors.body.border;
                      return '#6b7280';
                    }}
                    nodeColor={(n) => {
                      if (n.id.startsWith('level-soul') || n.id.startsWith('soul-')) return levelColors.soul.bg;
                      if (n.id.startsWith('level-mind') || n.id.startsWith('mind-')) return levelColors.mind.bg;
                      if (n.id.startsWith('level-body') || n.id.startsWith('body-')) return levelColors.body.bg;
                      return '#6b7280';
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-lg"
                  />
                  <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#374151" />
                </ReactFlow>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Оберіть бренд та сесію для відображення карти</p>
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
    </div>
  );
}
