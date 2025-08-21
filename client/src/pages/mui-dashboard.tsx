import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { CreateBrandDialog } from '@/components/brands/CreateBrandDialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserBrand, GameSession } from '@shared/schema';

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

export default function MuiDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<{id: string, name: string} | null>(null);

  // Завантаження брендів користувача
  const { data: brands = [], isLoading: brandsLoading } = useQuery<UserBrand[]>({
    queryKey: ['/api/user/brands'],
    enabled: !!user,
  });

  // Завантаження активних сесій
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: !!user,
  });

  // Мутація для видалення бренду
  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      return apiRequest('DELETE', `/api/user/brands/${brandId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
      toast({
        title: "Бренд видалено",
        description: "Бренд та всі пов'язані дані успішно видалено",
      });
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити бренд",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення нової гри
  const createGameMutation = useMutation({
    mutationFn: async (brandId: string) => {
      const response = await apiRequest('POST', '/api/game-sessions', { brandId });
      return response as GameSession;
    },
    onSuccess: (session: GameSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
      setLocation(`/game/${session.id}`);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити нову гру",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    setBrandToDelete({ id: brandId, name: brandName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBrand = () => {
    if (brandToDelete) {
      deleteBrandMutation.mutate(brandToDelete.id);
    }
  };

  const handleStartGame = (brandId: string) => {
    createGameMutation.mutate(brandId);
  };

  const handleContinueGame = (sessionId: string) => {
    setLocation(`/game/${sessionId}`);
  };

  const handleViewResults = (sessionId: string) => {
    setLocation(`/brand-board/${sessionId}`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Статистика
  const totalBrands = brands.length;
  const completedGames = sessions.filter(s => s.completed).length;
  const activeGames = sessions.filter(s => !s.completed).length;
  const totalXP = sessions.reduce((sum, session) => sum + (session.totalXp || 0), 0);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return FavoriteIcon;
      case 'mind': return PsychologyIcon;
      case 'body': return FitnessCenterIcon;
      default: return PersonIcon;
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'soul': return 'secondary';
      case 'mind': return 'primary';
      case 'body': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h3" gutterBottom>
                Дашборд
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Керуйте своїми брендами та грами
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateBrandOpen(true)}
              data-testid="button-create-brand"
            >
              Новий бренд
            </Button>
          </Box>

          {/* Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 48, height: 48, mx: 'auto', mb: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h4" component="div" gutterBottom>
                    {totalBrands}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Брендів
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48, mx: 'auto', mb: 2 }}>
                    <TrophyIcon />
                  </Avatar>
                  <Typography variant="h4" component="div" gutterBottom>
                    {completedGames}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Завершено
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48, mx: 'auto', mb: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="h4" component="div" gutterBottom>
                    {activeGames}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Активних
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48, mx: 'auto', mb: 2 }}>
                    <BoltIcon />
                  </Avatar>
                  <Typography variant="h4" component="div" gutterBottom>
                    {totalXP}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всього XP
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Main Content */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Мої бренди" />
            <Tab label="Активні ігри" />
            <Tab label="Завершені ігри" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            {brands.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Ще немає брендів
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Створіть свій перший бренд, щоб розпочати подорож самопізнання
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateBrandOpen(true)}
                  >
                    Створити перший бренд
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {/* Карта створення нового бренду */}
                <Grid item xs={12} md={6} lg={4}>
                  <Card 
                    sx={{ 
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                    onClick={() => setCreateBrandOpen(true)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                        <AddIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Створити новий бренд
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Почніть подорож створення нового бренду
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {brands.map((brand) => {
                  const brandSessions = sessions.filter(s => s.brandId === brand.id);
                  const completedBrandGames = brandSessions.filter(s => s.completed).length;
                  const activeBrandGame = brandSessions.find(s => !s.completed);
                  
                  const rawProgress = activeBrandGame?.progress || 0;
                  const progress = Math.min(Math.round(rawProgress), 100);
                  
                  const hasActiveGame = !!activeBrandGame;
                  const isCompleted = !hasActiveGame && completedBrandGames > 0;
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={brand.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="div" gutterBottom>
                                {brand.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {brand.description || 'Опис бренду'}
                              </Typography>
                              
                              {/* Статус */}
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                {hasActiveGame && (
                                  <Chip label="Активний" color="primary" size="small" />
                                )}
                                {isCompleted && (
                                  <Chip label="Завершений" color="success" size="small" />
                                )}
                                {completedBrandGames > 0 && (
                                  <Chip label={`${completedBrandGames} завершено`} variant="outlined" size="small" />
                                )}
                              </Stack>
                            </Box>
                            
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBrand(brand.id, brand.name);
                              }}
                              data-testid={`delete-brand-${brand.id}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          {/* Прогрес */}
                          {hasActiveGame && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Прогрес
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {progress}%
                                </Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={progress} />
                            </Box>
                          )}
                          
                          {/* Дата оновлення */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                            <CalendarIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              {new Date(brand.updatedAt).toLocaleDateString('uk-UA')}
                            </Typography>
                          </Box>
                        </CardContent>
                        
                        <Divider />
                        
                        <Box sx={{ p: 2 }}>
                          {hasActiveGame ? (
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => handleContinueGame(activeBrandGame.id)}
                                sx={{ flexGrow: 1 }}
                                data-testid={`continue-game-${brand.id}`}
                              >
                                Продовжити
                              </Button>
                              <IconButton
                                size="small"
                                onClick={() => handleViewResults(activeBrandGame.id)}
                                data-testid={`view-results-${brand.id}`}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleStartGame(brand.id)}
                              fullWidth
                              data-testid={`start-game-${brand.id}`}
                            >
                              Нова гра
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {sessions.filter(s => !s.completed).length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <TrendingUpIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Немає активних ігор
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Розпочніть нову гру з одного з ваших брендів
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {sessions.filter(s => !s.completed).map((session) => {
                  const brand = brands.find(b => b.id === session.brandId);
                  const LevelIcon = getLevelIcon(session.currentLevel);
                  const rawSessionProgress = session.progress || 0;
                  const progressPercentage = Math.min(Math.round(rawSessionProgress), 100);
                  
                  return (
                    <Card key={session.id}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${getLevelColor(session.currentLevel)}.light` }}>
                            <LevelIcon />
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" component="div">
                                  {brand?.name || 'Невідомий бренд'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Поточний рівень: {getLevelName(session.currentLevel)}
                                </Typography>
                              </Box>
                              <Chip label={`${progressPercentage}% завершено`} variant="outlined" />
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Прогрес
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {session.completedCards?.length || 0}/15 карток
                                </Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={progressPercentage} />
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <BoltIcon sx={{ fontSize: 16 }} />
                                  <Typography variant="body2">{session.totalXp || 0} XP</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 16 }} />
                                  <Typography variant="body2">
                                    {new Date(session.updatedAt).toLocaleDateString('uk-UA')}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Stack direction="row" spacing={1}>
                                <Button 
                                  size="small"
                                  variant="contained"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() => handleContinueGame(session.id)}
                                  data-testid={`continue-session-${session.id}`}
                                >
                                  Продовжити
                                </Button>
                                {progressPercentage > 0 && (
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleViewResults(session.id)}
                                    data-testid={`view-session-results-${session.id}`}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {sessions.filter(s => s.completed).length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Ще немає завершених ігор
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Завершіть вашу першу гру, щоб побачити результати тут
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {sessions.filter(s => s.completed).map((session) => {
                  const brand = brands.find(b => b.id === session.brandId);
                  const completionDate = new Date(session.updatedAt);
                  
                  return (
                    <Card key={session.id}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.light' }}>
                            <TrophyIcon />
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" component="div">
                                  {brand?.name || 'Невідомий бренд'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Гра завершена • {completionDate.toLocaleDateString('uk-UA')}
                                </Typography>
                              </Box>
                              <Chip label="Завершено" color="success" />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, color: 'text.secondary' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FavoriteIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                                <Typography variant="body2">
                                  {Array.isArray(session.completedCards) ? session.completedCards.filter((c: any) => c.startsWith('soul-')).length : 0} Душа
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PsychologyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2">
                                  {Array.isArray(session.completedCards) ? session.completedCards.filter((c: any) => c.startsWith('mind-')).length : 0} Розум
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FitnessCenterIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2">
                                  {Array.isArray(session.completedCards) ? session.completedCards.filter((c: any) => c.startsWith('body-')).length : 0} Тіло
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BoltIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="body2">{session.totalXp || 0} XP</Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Всього відповідей: {Array.isArray(session.completedCards) ? session.completedCards.length : 0}
                              </Typography>
                              
                              <Stack direction="row" spacing={1}>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleViewResults(session.id)}
                                  data-testid={`view-completed-results-${session.id}`}
                                >
                                  Карта бренду
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() => handleStartGame(brand?.id || '')}
                                  data-testid={`restart-game-${session.id}`}
                                >
                                  Нова гра
                                </Button>
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>
        </Paper>
      </Container>

      {/* Create Brand Dialog */}
      <CreateBrandDialog 
        open={createBrandOpen} 
        onOpenChange={setCreateBrandOpen}
        onBrandCreated={(brand) => {
          setCreateBrandOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/user/brands'] });
          toast({
            title: "Бренд створено",
            description: `Бренд "${brand.name}" успішно створено`,
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Видалити бренд?</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити бренд "{brandToDelete?.name}"? 
            Ця дія також видалить всі пов'язані ігри та результати.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button 
            onClick={confirmDeleteBrand} 
            color="error" 
            variant="contained"
            disabled={deleteBrandMutation.isPending}
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}