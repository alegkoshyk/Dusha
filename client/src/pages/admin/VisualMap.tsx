import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Map, Sparkles, Heart, Brain, Briefcase, Plus, ZoomIn, ZoomOut, Maximize2, LayoutGrid, Trash2, Edit3, FileText, MessageSquare, Save } from 'lucide-react';
import { Link } from 'wouter';
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

const levelColors: Record<string, { bg: string; border: string; text: string }> = {
  soul: { bg: '#ec4899', border: '#db2777', text: '#fce7f3' },
  mind: { bg: '#3b82f6', border: '#2563eb', text: '#dbeafe' },
  body: { bg: '#22c55e', border: '#16a34a', text: '#dcfce7' },
  note: { bg: '#8b5cf6', border: '#7c3aed', text: '#ede9fe' },
  idea: { bg: '#f59e0b', border: '#d97706', text: '#fef3c7' },
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

class ContentNode extends ClassicPreset.Node {
  width = 240;
  height = 160;
  nodeType: string;
  content: string;
  
  constructor(label: string, nodeType: string, content: string = '') {
    super(label);
    this.nodeType = nodeType;
    this.content = content;
    this.addOutput('out', new ClassicPreset.Output(new Socket('data'), 'Вихід'));
    this.addInput('in', new ClassicPreset.Input(new Socket('data'), 'Вхід'));
  }
}

class HeaderNode extends ClassicPreset.Node {
  width = 200;
  height = 80;
  nodeType: string;
  
  constructor(label: string, nodeType: string) {
    super(label);
    this.nodeType = nodeType;
    this.addOutput('cards', new ClassicPreset.Output(new Socket('level'), 'Картки'));
    this.addInput('prev', new ClassicPreset.Input(new Socket('level'), 'Попередній'));
    this.addOutput('next', new ClassicPreset.Output(new Socket('level'), 'Наступний'));
  }
}

type Nodes = ContentNode | HeaderNode;
type Conns = ClassicPreset.Connection<Nodes, Nodes>;
type Schemes = GetSchemes<Nodes, Conns>;
type AreaExtra = ReactArea2D<Schemes>;

interface EditorState {
  editor: NodeEditor<Schemes> | null;
  area: AreaPlugin<Schemes, AreaExtra> | null;
}

export default function VisualMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorState, setEditorState] = useState<EditorState>({ editor: null, area: null });
  
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; content: string; nodeType: string } | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editContent, setEditContent] = useState('');
  const { toast } = useToast();
  
  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['/api/admin/brands'],
  });
  
  const { data: sessions } = useQuery<GameSession[]>({
    queryKey: ['/api/admin/brand-sessions', selectedBrandId],
    enabled: !!selectedBrandId,
  });
  
  const { data: responsesMap } = useQuery<Record<string, any>>({
    queryKey: ['/api/game-sessions', selectedSessionId, 'responses-map'],
    enabled: !!selectedSessionId,
  });
  
  const initEditor = useCallback(async (container: HTMLElement) => {
    const editor = new NodeEditor<Schemes>();
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
    
    render.addPreset(Presets.classic.setup() as any);
    connection.addPreset(ConnectionPresets.classic.setup() as any);
    
    editor.use(area);
    area.use(connection);
    area.use(render);
    
    area.addPipe((context) => {
      if (context.type === 'nodepicked') {
        const nodeId = context.data.id;
        const node = editor.getNode(nodeId);
        if (node instanceof ContentNode) {
          setSelectedNode({
            id: nodeId,
            label: node.label,
            content: node.content,
            nodeType: node.nodeType,
          });
          setEditLabel(node.label);
          setEditContent(node.content);
        }
      }
      return context;
    });
    
    setEditorState({ editor, area });
    
    return { editor, area };
  }, []);
  
  const loadSessionData = useCallback(async (
    editor: NodeEditor<Schemes>, 
    area: AreaPlugin<Schemes, AreaExtra>,
    responses: Record<string, any>
  ) => {
    const existingNodes = editor.getNodes();
    for (const node of existingNodes) {
      await editor.removeNode(node.id);
    }
    
    const levels = [
      { id: 'soul', name: '💗 Душа' },
      { id: 'mind', name: '🧠 Розум' },
      { id: 'body', name: '💼 Тіло' },
    ];
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const headerNode = new HeaderNode(level.name, level.id);
      await editor.addNode(headerNode);
      await area.translate(headerNode.id, { x: i * 500, y: 0 });
      
      const levelResponses = Object.entries(responses).filter(([cardId]) => 
        cardId.startsWith(`${level.id}-`)
      );
      
      for (let j = 0; j < levelResponses.length; j++) {
        const [cardId, responseData] = levelResponses[j];
        const col = j % 2;
        const row = Math.floor(j / 2);
        
        const responseText = formatResponse(responseData?.response);
        const label = cardLabels[cardId] || cardId.replace(`${level.id}-`, '');
        
        const contentNode = new ContentNode(label, level.id, responseText);
        await editor.addNode(contentNode);
        
        const x = i * 500 + (col === 0 ? -80 : 80);
        const y = 160 + row * 180;
        await area.translate(contentNode.id, { x, y });
        
        try {
          await editor.addConnection(
            new ClassicPreset.Connection(headerNode as any, 'cards', contentNode as any, 'in')
          );
        } catch (e) {}
      }
      
      if (i > 0) {
        const prevHeader = editor.getNodes().find(n => n instanceof HeaderNode && n.nodeType === levels[i - 1].id);
        if (prevHeader) {
          try {
            await editor.addConnection(
              new ClassicPreset.Connection(prevHeader as any, 'next', headerNode as any, 'prev')
            );
          } catch (e) {}
        }
      }
    }
    
    setTimeout(() => {
      AreaExtensions.zoomAt(area, editor.getNodes());
    }, 100);
  }, []);
  
  useEffect(() => {
    if (containerRef.current && !editorState.editor) {
      initEditor(containerRef.current);
    }
    
    return () => {
      if (editorState.area) {
        editorState.area.destroy();
      }
    };
  }, []);
  
  useEffect(() => {
    if (editorState.editor && editorState.area && responsesMap && Object.keys(responsesMap).length > 0) {
      loadSessionData(editorState.editor, editorState.area, responsesMap);
    }
  }, [responsesMap, editorState.editor, editorState.area, loadSessionData]);
  
  const addNode = useCallback(async (type: string) => {
    if (!editorState.editor || !editorState.area) return;
    
    const labels: Record<string, string> = {
      soul: 'Нова картка Душі',
      mind: 'Нова картка Розуму',
      body: 'Нова картка Тіла',
      note: 'Нотатка',
      idea: 'Ідея',
    };
    
    const node = new ContentNode(labels[type] || 'Новий вузол', type, '');
    await editorState.editor.addNode(node);
    
    const { x, y } = editorState.area.area.pointer;
    await editorState.area.translate(node.id, { x: x || 200, y: y || 200 });
    
    toast({ title: 'Додано', description: `Новий вузол "${labels[type]}" створено` });
  }, [editorState, toast]);
  
  const deleteSelectedNode = useCallback(async () => {
    if (!editorState.editor || !selectedNode) return;
    
    try {
      await editorState.editor.removeNode(selectedNode.id);
      setSelectedNode(null);
      toast({ title: 'Видалено', description: 'Вузол успішно видалено' });
    } catch (e) {
      toast({ title: 'Помилка', description: 'Не вдалося видалити вузол', variant: 'destructive' });
    }
  }, [editorState, selectedNode, toast]);
  
  const updateSelectedNode = useCallback(async () => {
    if (!editorState.editor || !selectedNode) return;
    
    const node = editorState.editor.getNode(selectedNode.id);
    if (node instanceof ContentNode) {
      node.label = editLabel;
      node.content = editContent;
      await editorState.area?.update('node', node.id);
      setSelectedNode(null);
      toast({ title: 'Збережено', description: 'Вузол успішно оновлено' });
    }
  }, [editorState, selectedNode, editLabel, editContent, toast]);
  
  const zoomIn = useCallback(() => {
    if (!editorState.area) return;
    const { k } = editorState.area.area.transform;
    editorState.area.area.zoom(k * 1.2);
  }, [editorState]);
  
  const zoomOut = useCallback(() => {
    if (!editorState.area) return;
    const { k } = editorState.area.area.transform;
    editorState.area.area.zoom(k / 1.2);
  }, [editorState]);
  
  const fitView = useCallback(() => {
    if (!editorState.editor || !editorState.area) return;
    AreaExtensions.zoomAt(editorState.area, editorState.editor.getNodes());
  }, [editorState]);
  
  const autoLayout = useCallback(async () => {
    if (!editorState.editor || !editorState.area) return;
    
    const nodes = editorState.editor.getNodes();
    const headers = nodes.filter(n => n instanceof HeaderNode);
    const contents = nodes.filter(n => n instanceof ContentNode);
    
    for (let i = 0; i < headers.length; i++) {
      await editorState.area.translate(headers[i].id, { x: i * 500, y: 0 });
    }
    
    const groupByType = (type: string) => contents.filter(n => (n as ContentNode).nodeType === type);
    
    const layoutGroup = async (nodes: Nodes[], baseX: number) => {
      for (let i = 0; i < nodes.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        await editorState.area!.translate(nodes[i].id, { 
          x: baseX + (col === 0 ? -100 : 100), 
          y: 180 + row * 180 
        });
      }
    };
    
    await layoutGroup(groupByType('soul'), 0);
    await layoutGroup(groupByType('mind'), 500);
    await layoutGroup(groupByType('body'), 1000);
    
    const otherNodes = contents.filter(n => !['soul', 'mind', 'body'].includes((n as ContentNode).nodeType));
    for (let i = 0; i < otherNodes.length; i++) {
      await editorState.area.translate(otherNodes[i].id, { x: 1500, y: i * 180 });
    }
    
    setTimeout(() => fitView(), 100);
    toast({ title: 'Готово', description: 'Автоматичне розташування застосовано' });
  }, [editorState, fitView, toast]);
  
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedSessionId(null);
  };
  
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  const filteredSessions = sessions?.filter(s => s.brandId === selectedBrandId && s.completed) || [];
  
  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 100,
    background: 'rgba(31, 41, 55, 0.95)',
    padding: 12,
    borderRadius: 12,
    border: '1px solid #374151',
    backdropFilter: 'blur(8px)',
  };
  
  const toolButtonStyle = (color?: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: color || '#374151',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 12,
    cursor: 'pointer',
  });
  
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
              Завантажити дані бренду
            </CardTitle>
            <CardDescription className="text-gray-400">
              Оберіть бренд для завантаження даних або почніть з чистого аркуша
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
          <CardContent className="p-0 relative">
            <div 
              ref={containerRef}
              style={{ height: '700px', width: '100%', background: '#1a1a2e' }}
              className="rounded-lg"
            />
            
            <div style={toolbarStyle}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                Додати вузол
              </div>
              <button style={toolButtonStyle(levelColors.soul.bg)} onClick={() => addNode('soul')}>
                <Heart size={14} /> Душа
              </button>
              <button style={toolButtonStyle(levelColors.mind.bg)} onClick={() => addNode('mind')}>
                <Brain size={14} /> Розум
              </button>
              <button style={toolButtonStyle(levelColors.body.bg)} onClick={() => addNode('body')}>
                <Briefcase size={14} /> Тіло
              </button>
              <button style={toolButtonStyle(levelColors.note.bg)} onClick={() => addNode('note')}>
                <FileText size={14} /> Нотатка
              </button>
              <button style={toolButtonStyle(levelColors.idea.bg)} onClick={() => addNode('idea')}>
                <MessageSquare size={14} /> Ідея
              </button>
              
              <div style={{ borderTop: '1px solid #374151', paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>
                  Масштаб
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...toolButtonStyle(), flex: 1 }} onClick={zoomIn}>
                    <ZoomIn size={14} />
                  </button>
                  <button style={{ ...toolButtonStyle(), flex: 1 }} onClick={zoomOut}>
                    <ZoomOut size={14} />
                  </button>
                </div>
                <button style={{ ...toolButtonStyle(), marginTop: 6, width: '100%' }} onClick={fitView}>
                  <Maximize2 size={14} /> Вписати
                </button>
              </div>
              
              <div style={{ borderTop: '1px solid #374151', paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>
                  Структура
                </div>
                <button style={{ ...toolButtonStyle(), width: '100%' }} onClick={autoLayout}>
                  <LayoutGrid size={14} /> Авто-розташування
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-5 gap-4">
          {Object.entries(levelColors).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: colors.bg }}></div>
              <span className="text-gray-400 capitalize">
                {key === 'soul' ? 'Душа' : key === 'mind' ? 'Розум' : key === 'body' ? 'Тіло' : key === 'note' ? 'Нотатка' : 'Ідея'}
              </span>
            </div>
          ))}
        </div>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="py-4">
            <div className="text-xs text-gray-500 flex items-center gap-6">
              <span>🖱️ Перетягуйте вузли</span>
              <span>🔗 З'єднуйте точками</span>
              <span>👆 Клік для редагування</span>
              <span>🎨 Ліва панель — інструменти</span>
              <span className="ml-auto text-cyan-500">Powered by Rete.js</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Редагування вузла
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Змініть назву та контент вузла
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Назва</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600 text-white"
                placeholder="Назва вузла..."
              />
            </div>
            <div>
              <Label className="text-gray-300">Контент</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600 text-white min-h-[150px]"
                placeholder="Введіть контент..."
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="destructive"
              onClick={deleteSelectedNode}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Видалити
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedNode(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Скасувати
            </Button>
            <Button 
              onClick={updateSelectedNode}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
