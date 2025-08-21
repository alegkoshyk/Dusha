import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Stack,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { GameCard, GameSession } from '@shared/schema';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MuiMobileGame() {
  const { sessionId } = useParams();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTabValue, setActiveTabValue] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Initialize activeSessionId from URL params or query string
  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    } else {
      // Check for sessionId in query string
      const urlParams = new URLSearchParams(location.split('?')[1] || '');
      const querySessionId = urlParams.get('sessionId');
      if (querySessionId) {
        setActiveSessionId(querySessionId);
      }
    }
  }, [sessionId, location]);

  // Fetch current session
  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ['/api/game-sessions', activeSessionId],
    enabled: !!activeSessionId,
  });

  // Fetch cards for current level
  const { data: cards = [], isLoading: cardsLoading } = useQuery<GameCard[]>({
    queryKey: ['/api/cards', session?.currentLevel],
    enabled: !!session?.currentLevel,
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ cardId, responseValue }: { cardId: string; responseValue: any }) => {
      return apiRequest('POST', `/api/game-sessions/${activeSessionId}/responses`, {
        cardId,
        responseValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', activeSessionId] });
      toast({
        title: "Відповідь збережено",
        description: "Ваша відповідь успішно збережена",
      });
    },
    onError: (error) => {
      console.error('Save response error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти відповідь",
        variant: "destructive",
      });
    },
  });

  const handleCardResponse = (cardId: string, response: any) => {
    if (!activeSessionId) return;
    saveResponseMutation.mutate({ cardId, responseValue: response });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTabValue(newValue);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return FavoriteIcon;
      case 'mind': return PsychologyIcon;
      case 'body': return FitnessCenterIcon;
      default: return PlayArrowIcon;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'soul': return 'secondary';
      case 'mind': return 'primary';
      case 'body': return 'success';
      default: return 'default';
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'soul': return 'Душа бренду';
      case 'mind': return 'Розум бренду';
      case 'body': return 'Тіло бренду';
      default: return 'Невідомо';
    }
  };

  const getCardProgress = (cardId: string) => {
    if (!session?.completedCards) return 'pending';
    const completedCards = Array.isArray(session.completedCards) ? session.completedCards : [];
    return completedCards.includes(cardId) ? 'completed' : 'pending';
  };

  const isCardUnlocked = (card: GameCard) => {
    if (!session?.completedCards) return card.positionX === 1;
    const completedCards = Array.isArray(session.completedCards) ? session.completedCards : [];
    
    // First card is always unlocked
    if (card.positionX === 1) return true;
    
    // Check if previous card is completed
    const previousCard = cards.find(c => c.positionX === card.positionX - 1);
    return previousCard ? completedCards.includes(previousCard.id) : false;
  };

  if (sessionLoading || cardsLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <LinearProgress sx={{ width: 200 }} />
          <Typography color="text.secondary">Завантаження гри...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>Сесію не знайдено</Typography>
          <Typography>Неможливо знайти гру з ID: {activeSessionId}</Typography>
          <Button onClick={() => setLocation('/')} sx={{ mt: 2 }}>
            Повернутися на головну
          </Button>
        </Alert>
      </Container>
    );
  }

  const levels = ['soul', 'mind', 'body'];
  const currentLevelIndex = levels.indexOf(session.currentLevel);
  const progress = session.progress || 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => setLocation('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>
              Душа Бренду
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Поточний рівень: {getLevelName(session.currentLevel)}
            </Typography>
          </Box>
          <Chip label={`${Math.round(progress)}%`} color="primary" />
        </Box>

        {/* Progress Bar */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Загальний прогрес</Typography>
              <Typography variant="body2" color="text.secondary">
                {Array.isArray(session.completedCards) ? session.completedCards.length : 0}/15 карток
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(progress, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981)',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Level Navigation */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={currentLevelIndex}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
          >
            {levels.map((level, index) => {
              const LevelIcon = getLevelIcon(level);
              const levelColor = getLevelColor(level);
              const levelCards = cards.filter(c => c.id.startsWith(level));
              const completedCards = Array.isArray(session.completedCards) ? session.completedCards : [];
              const levelCompleted = levelCards.every(card => completedCards.includes(card.id));
              
              return (
                <Tab
                  key={level}
                  icon={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: `${levelColor}.light`, width: 32, height: 32 }}>
                        <LevelIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      {levelCompleted && <CheckIcon color="success" />}
                    </Stack>
                  }
                  label={getLevelName(level)}
                  disabled={index > currentLevelIndex}
                />
              );
            })}
          </Tabs>
        </Paper>

        {/* Game Cards */}
        <Stack spacing={3}>
          {cards
            .filter(card => card.id.startsWith(session.currentLevel))
            .sort((a, b) => a.positionX - b.positionX)
            .map((card) => {
              const isUnlocked = isCardUnlocked(card);
              const progress = getCardProgress(card.id);
              const isCompleted = progress === 'completed';

              return (
                <Card 
                  key={card.id}
                  sx={{
                    opacity: isUnlocked ? 1 : 0.6,
                    border: isCompleted ? 2 : 1,
                    borderColor: isCompleted ? 'success.main' : 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: isCompleted ? 'success.main' : isUnlocked ? 'primary.main' : 'grey.400',
                          mt: 1,
                        }}
                      >
                        {isCompleted ? (
                          <CheckIcon />
                        ) : isUnlocked ? (
                          <PlayArrowIcon />
                        ) : (
                          <LockIcon />
                        )}
                      </Avatar>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" gutterBottom>
                          {card.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {card.description}
                        </Typography>

                        {isUnlocked && !isCompleted && (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => setLocation(`/game/${activeSessionId}?card=${card.id}`)}
                            data-testid={`play-card-${card.id}`}
                          >
                            Відповісти
                          </Button>
                        )}

                        {isCompleted && (
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label="Завершено"
                              color="success"
                              size="small"
                              icon={<CheckIcon />}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setLocation(`/game/${activeSessionId}?card=${card.id}`)}
                              data-testid={`edit-card-${card.id}`}
                            >
                              Редагувати
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
        </Stack>

        {/* Bottom Actions */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setLocation(`/brand-board/${activeSessionId}`)}
            data-testid="view-brand-board"
          >
            Переглянути карту бренду
          </Button>
        </Box>
      </Container>
    </Box>
  );
}