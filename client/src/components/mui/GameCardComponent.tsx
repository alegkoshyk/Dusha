import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Box,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Paper,
  Divider,
} from '@mui/material';
import {
  Lock as LockIcon,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as TimeIcon,
  EmojiEvents as RewardIcon,
} from '@mui/icons-material';
import type { GameCard } from '@shared/schema';

interface GameCardComponentProps {
  card: GameCard;
  isUnlocked: boolean;
  isCompleted: boolean;
  onResponse: (cardId: string, response: any) => void;
}

export function GameCardComponent({ card, isUnlocked, isCompleted, onResponse }: GameCardComponentProps) {
  const [response, setResponse] = useState<any>('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!response || response.length === 0) return;
    onResponse(card.id, response);
    setSubmitted(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const renderResponseInput = () => {
    switch (card.type) {
      case 'text':
      case 'reflection':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Введіть вашу відповідь..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={!isUnlocked || isCompleted}
            sx={{ mt: 2 }}
          />
        );

      case 'choice':
        return (
          <RadioGroup
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            sx={{ mt: 2 }}
          >
            <FormControlLabel value="option1" control={<Radio />} label="Варіант 1" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="option2" control={<Radio />} label="Варіант 2" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="option3" control={<Radio />} label="Варіант 3" disabled={!isUnlocked || isCompleted} />
          </RadioGroup>
        );

      case 'values':
        return (
          <FormGroup sx={{ mt: 2 }}>
            {['Інновації', 'Якість', 'Надійність', 'Творчість', 'Соціальна відповідальність'].map((value) => (
              <FormControlLabel
                key={value}
                control={
                  <Checkbox
                    checked={Array.isArray(response) ? response.includes(value) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(response) ? response : [];
                      if (e.target.checked) {
                        setResponse([...currentValues, value]);
                      } else {
                        setResponse(currentValues.filter((v: string) => v !== value));
                      }
                    }}
                    disabled={!isUnlocked || isCompleted}
                  />
                }
                label={value}
              />
            ))}
          </FormGroup>
        );

      case 'archetype' as any:
        return (
          <RadioGroup
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            sx={{ mt: 2 }}
          >
            <FormControlLabel value="creator" control={<Radio />} label="Творець" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="hero" control={<Radio />} label="Герой" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="magician" control={<Radio />} label="Маг" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="innocent" control={<Radio />} label="Простак" disabled={!isUnlocked || isCompleted} />
            <FormControlLabel value="explorer" control={<Radio />} label="Дослідник" disabled={!isUnlocked || isCompleted} />
          </RadioGroup>
        );

      default:
        return (
          <TextField
            fullWidth
            placeholder="Введіть вашу відповідь..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={!isUnlocked || isCompleted}
            sx={{ mt: 2 }}
          />
        );
    }
  };

  return (
    <Card 
      sx={{
        opacity: isUnlocked ? 1 : 0.6,
        border: isCompleted ? 2 : 1,
        borderColor: isCompleted ? 'success.main' : 'divider',
        transition: 'all 0.3s ease',
        '&:hover': isUnlocked ? {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        } : {},
      }}
    >
      <CardContent>
        {/* Card Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3">
                {card.title}
              </Typography>
              {!isUnlocked && <LockIcon color="disabled" sx={{ fontSize: 20 }} />}
              {isCompleted && <CheckIcon color="success" sx={{ fontSize: 20 }} />}
            </Stack>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {card.description}
            </Typography>

            {card.hint && (
              <Paper sx={{ p: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', mb: 2 }}>
                <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                  💡 {card.hint}
                </Typography>
              </Paper>
            )}
          </Box>

          <Stack spacing={1} alignItems="flex-end">
            <Chip 
              label={card.difficulty} 
              color={getDifficultyColor(card.difficulty)} 
              size="small"
            />
            {card.estimatedTime && (
              <Chip 
                icon={<TimeIcon />}
                label={`${card.estimatedTime} хв`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Response Section */}
        {isUnlocked && !card.id.includes('start') && (
          <>
            <Divider sx={{ my: 2 }} />
            {renderResponseInput()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Box>
                {(card.rewards as any)?.xp && (
                  <Chip 
                    icon={<RewardIcon />}
                    label={`+${(card.rewards as any).xp} XP`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Button
                variant={isCompleted ? "outlined" : "contained"}
                startIcon={isCompleted ? <CheckIcon /> : <PlayArrowIcon />}
                onClick={handleSubmit}
                disabled={!response || response.length === 0 || submitted || isCompleted}
                sx={{ minWidth: 120 }}
              >
                {isCompleted ? 'Завершено' : submitted ? 'Збережено' : 'Відповісти'}
              </Button>
            </Box>
          </>
        )}

        {/* Start Card Special Handling */}
        {card.id.includes('start') && isUnlocked && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => onResponse(card.id, 'ready')}
              disabled={isCompleted}
              sx={{ minWidth: 200 }}
            >
              {isCompleted ? 'Готово!' : 'Почати'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}