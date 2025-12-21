import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import styled from 'styled-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Map, Sparkles, Eye, Heart, Brain, Briefcase, Download } from 'lucide-react';
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

class Socket extends ClassicPreset.Socket {
  constructor(name: string) {
    super(name);
  }
}

class BrandNode extends ClassicPreset.Node {
  width = 220;
  height = 140;
  levelId: string;
  responseText: string;
  isSkipped: boolean;
  
  constructor(
    label: string, 
    levelId: string, 
    responseText: string, 
    isSkipped: boolean = false
  ) {
    super(label);
    this.levelId = levelId;
    this.responseText = responseText;
    this.isSkipped = isSkipped;
    
    this.addOutput('out', new ClassicPreset.Output(new Socket('data'), 'Далі'));
    this.addInput('in', new ClassicPreset.Input(new Socket('data'), 'Від'));
  }
}

class LevelNode extends ClassicPreset.Node {
  width = 180;
  height = 80;
  levelId: string;
  
  constructor(label: string, levelId: string) {
    super(label);
    this.levelId = levelId;
    this.addOutput('cards', new ClassicPreset.Output(new Socket('level'), 'Картки'));
    this.addInput('prev', new ClassicPreset.Input(new Socket('level'), 'Попередній'));
    this.addOutput('next', new ClassicPreset.Output(new Socket('level'), 'Наступний'));
  }
}

type Node = BrandNode | LevelNode;
type Conn = ClassicPreset.Connection<Node, Node>;
type Schemes = GetSchemes<Node, Conn>;
type AreaExtra = ReactArea2D<Schemes>;

const StyledNode = styled.div<{ levelId: string; isSkipped?: boolean }>`
  background: ${props => {
    if (props.isSkipped) return '#fef3c7';
    const colors = levelColors[props.levelId as keyof typeof levelColors];
    return colors ? colors.text : '#f9fafb';
  }};
  border: 2px solid ${props => {
    if (props.isSkipped) return '#f59e0b';
    const colors = levelColors[props.levelId as keyof typeof levelColors];
    return colors ? colors.border : '#e5e7eb';
  }};
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 200px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .node-title {
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .node-content {
    font-size: 12px;
    color: #4b5563;
    line-height: 1.4;
  }
  
  .skipped-badge {
    background: #f59e0b;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
  }
`;

const StyledLevelNode = styled.div<{ levelId: string }>`
  background: ${props => levelColors[props.levelId as keyof typeof levelColors]?.bg || '#6b7280'};
  color: white;
  border: 3px solid ${props => levelColors[props.levelId as keyof typeof levelColors]?.border || '#4b5563'};
  border-radius: 16px;
  padding: 16px 32px;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  min-width: 160px;
`;

function CustomBrandNode(props: { data: BrandNode }) {
  const { data } = props;
  
  return (
    <StyledNode levelId={data.levelId} isSkipped={data.isSkipped}>
      <div className="node-title">
        {data.isSkipped && <span className="skipped-badge">Пропущено</span>}
        {data.label}
      </div>
      <div className="node-content">
        {data.isSkipped 
          ? 'Користувач пропустив цю картку'
          : truncateText(data.responseText || 'Немає відповіді', 100)}
      </div>
    </StyledNode>
  );
}

function CustomLevelNode(props: { data: LevelNode }) {
  const { data } = props;
  const icons: Record<string, any> = {
    soul: '💗',
    mind: '🧠',
    body: '💼',
  };
  
  return (
    <StyledLevelNode levelId={data.levelId}>
      {icons[data.levelId]} {data.label}
    </StyledLevelNode>
  );
}

async function createEditor(
  container: HTMLElement,
  responsesMap: Record<string, any>,
  onNodeClick: (cardId: string, response: any, isSkipped: boolean) => void
) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  
  render.addPreset(Presets.classic.setup() as any);
  connection.addPreset(ConnectionPresets.classic.setup() as any);
  
  editor.use(area);
  area.use(connection);
  area.use(render);
  
  const levels = [
    { id: 'soul', name: 'Душа' },
    { id: 'mind', name: 'Розум' },
    { id: 'body', name: 'Тіло' },
  ];
  
  const levelNodes: Record<string, LevelNode> = {};
  const cardNodes: Record<string, BrandNode> = {};
  
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const levelNode = new LevelNode(level.name, level.id);
    await editor.addNode(levelNode);
    await area.translate(levelNode.id, { x: i * 450, y: 0 });
    levelNodes[level.id] = levelNode;
    
    const levelResponses = Object.entries(responsesMap).filter(([cardId]) => 
      cardId.startsWith(`${level.id}-`)
    );
    
    for (let j = 0; j < levelResponses.length; j++) {
      const [cardId, responseData] = levelResponses[j];
      const col = j % 2;
      const row = Math.floor(j / 2);
      
      const isSkipped = responseData?.skipped === true;
      const responseText = formatResponse(responseData?.response);
      const label = cardLabels[cardId] || cardId.replace(`${level.id}-`, '');
      
      const cardNode = new BrandNode(label, level.id, responseText, isSkipped);
      await editor.addNode(cardNode);
      
      const x = i * 450 + (col === 0 ? -100 : 100);
      const y = 150 + row * 160;
      await area.translate(cardNode.id, { x, y });
      
      cardNodes[cardId] = cardNode;
      
      try {
        await editor.addConnection(
          new ClassicPreset.Connection(levelNode, 'cards', cardNode, 'in')
        );
      } catch (e) {
        console.log('Connection already exists or failed');
      }
    }
    
    if (i > 0) {
      const prevLevel = levels[i - 1];
      try {
        await editor.addConnection(
          new ClassicPreset.Connection(levelNodes[prevLevel.id], 'next', levelNode, 'prev')
        );
      } catch (e) {
        console.log('Level connection already exists or failed');
      }
    }
  }
  
  area.addPipe((context) => {
    if (context.type === 'nodepicked') {
      const nodeId = context.data.id;
      const node = editor.getNode(nodeId);
      if (node instanceof BrandNode) {
        const cardId = Object.keys(cardNodes).find(key => cardNodes[key].id === nodeId);
        if (cardId) {
          const responseData = responsesMap[cardId];
          onNodeClick(cardId, responseData?.response, responseData?.skipped || false);
        }
      }
    }
    return context;
  });
  
  AreaExtensions.zoomAt(area, editor.getNodes());
  
  return {
    destroy: () => area.destroy(),
  };
}

export default function VisualMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ destroy: () => void } | null>(null);
  
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ cardId: string; response: any; isSkipped: boolean } | null>(null);
  
  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['/api/admin/brands'],
  });
  
  const { data: sessions, isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/admin/brand-sessions', selectedBrandId],
    enabled: !!selectedBrandId,
  });
  
  const { data: responsesMap } = useQuery<Record<string, any>>({
    queryKey: ['/api/game-sessions', selectedSessionId, 'responses-map'],
    enabled: !!selectedSessionId,
  });
  
  const handleNodeClick = useCallback((cardId: string, response: any, isSkipped: boolean) => {
    setSelectedCard({ cardId, response, isSkipped });
  }, []);
  
  useEffect(() => {
    if (containerRef.current && responsesMap && Object.keys(responsesMap).length > 0) {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
      
      createEditor(containerRef.current, responsesMap, handleNodeClick)
        .then(editor => {
          editorRef.current = editor;
        })
        .catch(console.error);
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [responsesMap, handleNodeClick]);
  
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedSessionId(null);
  };
  
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  const filteredSessions = sessions?.filter(s => s.brandId === selectedBrandId && s.completed) || [];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Map className="h-8 w-8 text-cyan-400" />
              Візуальна Карта
            </h1>
            <p className="text-gray-400 mt-2">Інтерактивний редактор карти бренду на Rete.js</p>
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
            <div 
              ref={containerRef}
              style={{ height: '700px', width: '100%', background: '#1a1a2e' }}
              className="rounded-lg"
            >
              {!selectedSessionId && (
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
            <Heart className="h-5 w-5" style={{ color: levelColors.soul.bg }} />
            <span className="text-gray-400">Душа — цінності, місія, історія</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: levelColors.mind.bg }} />
            <span className="text-gray-400">Розум — стратегія, аудиторія</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" style={{ color: levelColors.body.bg }} />
            <span className="text-gray-400">Тіло — продукти, канали</span>
          </div>
        </div>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="py-4">
            <div className="text-xs text-gray-500 flex items-center gap-4">
              <span>🖱️ Перетягуйте вузли для переміщення</span>
              <span>🔍 Колесо миші для масштабування</span>
              <span>👆 Клікніть на картку для деталей</span>
              <span className="ml-auto text-cyan-500">Powered by Rete.js</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedCard && (cardLabels[selectedCard.cardId] || selectedCard.cardId)}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCard?.isSkipped 
                ? 'Ця картка була пропущена користувачем'
                : 'Перегляд відповіді на картку'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCard?.isSkipped ? (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <span className="font-medium">⏭️ Пропущено</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 border border-gray-600 rounded-md p-4 min-h-[100px] whitespace-pre-wrap">
              {formatResponse(selectedCard?.response) || <span className="text-gray-500 italic">Немає відповіді</span>}
            </div>
          )}
          
          <DialogFooter>
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
