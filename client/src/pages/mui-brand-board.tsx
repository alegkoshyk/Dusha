import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
  Grid,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Check as CheckIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  FitnessCenter as FitnessCenterIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { GameSession } from '@shared/schema';

interface BrandMapData {
  [levelId: string]: {
    [cardId: string]: {
      title: string;
      response: any;
      timestamp: string;
    };
  };
}

export default function MuiBrandBoard() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session data
  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ['/api/game-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Fetch brand map data
  const { data: brandMapData, isLoading: brandMapLoading } = useQuery<any>({
    queryKey: [`/api/game-sessions/${sessionId}/brand-map`],
    enabled: !!sessionId,
  });

  // Auto-complete game when accessing brand board
  const completeGameMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/game-sessions/${sessionId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
    },
  });

  useEffect(() => {
    if (session && !session.completed && sessionId) {
      completeGameMutation.mutate();
    }
  }, [session, sessionId]);

  const handleExportPDF = () => {
    if (!brandMapData || !session) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Карта Бренду', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.text(`Створено: ${new Date().toLocaleDateString('uk-UA')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Process each level
    const levels = [
      { id: 'soul', name: 'Душа бренду', color: '#8b5cf6' },
      { id: 'mind', name: 'Розум бренду', color: '#3b82f6' },
      { id: 'body', name: 'Тіло бренду', color: '#10b981' }
    ];

    levels.forEach((level) => {
      const levelData = brandMapData[level.id];
      if (!levelData) return;

      // Level header
      doc.setFontSize(16);
      doc.text(level.name, 20, yPosition);
      yPosition += 10;

      // Level responses
      Object.entries(levelData).forEach(([cardId, cardData]) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text(`${cardData.title}:`, 25, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        const responseText = typeof cardData.response === 'string' 
          ? cardData.response 
          : JSON.stringify(cardData.response);
        
        const lines = doc.splitTextToSize(responseText, pageWidth - 50);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 30, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      });
      yPosition += 10;
    });

    doc.save(`brand-map-${new Date().getTime()}.pdf`);
    
    toast({
      title: "PDF експортовано",
      description: "Карта бренду успішно збережена як PDF",
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return FavoriteIcon;
      case 'mind': return PsychologyIcon;
      case 'body': return FitnessCenterIcon;
      default: return CheckIcon;
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

  const formatResponse = (response: any) => {
    if (typeof response === 'string') {
      return response;
    }
    if (Array.isArray(response)) {
      return response.join(', ');
    }
    if (typeof response === 'object' && response !== null) {
      return JSON.stringify(response, null, 2);
    }
    return String(response);
  };

  if (sessionLoading || brandMapLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <LinearProgress sx={{ width: 200 }} />
          <Typography color="text.secondary">Завантаження карти бренду...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!session || !brandMapData) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>Карту бренду не знайдено</Typography>
          <Typography>Неможливо завантажити дані для сесії: {sessionId}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Спробуйте перейти на гру та заповнити більше карток.
          </Typography>
          <Button onClick={() => setLocation('/')} sx={{ mt: 2 }}>
            Повернутися на головну
          </Button>
        </Alert>
      </Container>
    );
  }

  const levels = ['soul', 'mind', 'body'];
  const totalResponses = brandMapData?.responses?.length || 
                       (brandMapData?.levels ? Object.values(brandMapData.levels).reduce((sum: number, level: any) => sum + (Array.isArray(level) ? level.length : 0), 0) : 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setLocation('/')}
            variant="outlined"
          >
            Назад
          </Button>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              Карта Бренду
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ваша повна стратегія бренду на основі відповідей
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPDF}
              data-testid="export-pdf"
            >
              Експорт PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              disabled
            >
              Поділитися
            </Button>
          </Stack>
        </Box>

        {/* Completion Banner */}
        {session.completed && totalResponses > 1 && (
          <Alert 
            severity="success" 
            sx={{ mb: 4 }}
            icon={<TrophyIcon />}
          >
            <Typography variant="h6" gutterBottom>
              Вітаємо! Гру завершено!
            </Typography>
            <Typography>
              Ви успішно пройшли всі {totalResponses} карток та створили повну карту свого бренду.
            </Typography>
          </Alert>
        )}

        {/* Progress Banner for incomplete games */}
        {!session.completed && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Карта бренду в процесі
            </Typography>
            <Typography>
              Заповнено {totalResponses} карток. Продовжте гру для створення повної карти бренду.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setLocation(`/mobile-game/${sessionId}`)}
              sx={{ mt: 2 }}
            >
              Продовжити гру
            </Button>
          </Alert>
        )}

        {/* Brand Map Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Огляд результатів
            </Typography>
            
            <Grid container spacing={3}>
              {levels.map((level) => {
                const levelData = brandMapData?.levels?.[level] || [];
                const LevelIcon = getLevelIcon(level);
                const levelColor = getLevelColor(level);
                const responseCount = Array.isArray(levelData) ? levelData.length : 0;
                
                return (
                  <Grid item xs={12} md={4} key={level}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: `${levelColor}.light`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                          <LevelIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {getLevelName(level)}
                        </Typography>
                        <Chip 
                          label={`${responseCount} відповідей`}
                          color={levelColor}
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* Detailed Brand Map */}
        <Stack spacing={4}>
          {levels.map((level) => {
            const levelData = brandMapData?.levels?.[level] || [];
            if (!Array.isArray(levelData) || levelData.length === 0) return null;

            const LevelIcon = getLevelIcon(level);
            const levelColor = getLevelColor(level);

            return (
              <Paper key={level} sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: `${levelColor}.main`, width: 48, height: 48 }}>
                    <LevelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {getLevelName(level)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {levelData.length} відповідей
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {levelData.map((cardData: any, index: number) => (
                    <Grid item xs={12} md={6} key={cardData.cardId || index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {cardData.cardTitle || cardData.cardId}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                minHeight: 60,
                              }}
                            >
                              {formatResponse(cardData.response)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary">
                            Відповідь від: {cardData.createdAt ? new Date(cardData.createdAt).toLocaleDateString('uk-UA') : 'Невідомо'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            );
          })}
        </Stack>

        {/* Footer Actions */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => setLocation('/')}
              data-testid="back-to-dashboard"
            >
              Повернутися до дашборду
            </Button>
            <Button
              variant="outlined"
              onClick={() => setLocation(`/game/${sessionId}`)}
              data-testid="continue-game"
            >
              Продовжити гру
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}