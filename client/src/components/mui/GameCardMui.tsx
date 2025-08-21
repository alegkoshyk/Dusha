import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Stack,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { GameCard, CardProperty } from '@shared/schema';

interface GameCardMuiProps {
  card: GameCard;
  sessionId: string;
  isCompleted: boolean;
  onResponseSaved: () => void;
}

export function GameCardMui({ card, sessionId, isCompleted, onResponseSaved }: GameCardMuiProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState<any>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Load card properties for choice/values cards
  const { data: properties = [] } = useQuery<CardProperty[]>({
    queryKey: ['/api/cards', card.id, 'properties'],
    enabled: ['choice', 'values', 'archetype'].includes(card.type),
  });

  // Load existing response
  const { data: existingResponse } = useQuery({
    queryKey: ['/api/game-sessions', sessionId, 'responses', card.id],
    enabled: !!sessionId,
  });

  React.useEffect(() => {
    if (existingResponse?.responseValue) {
      const value = existingResponse.responseValue;
      if (card.type === 'values' && Array.isArray(value)) {
        setSelectedValues(value);
      } else if (typeof value === 'string') {
        setResponse(value);
      } else {
        setResponse(String(value));
      }
    }
  }, [existingResponse, card.type]);

  const saveResponseMutation = useMutation({
    mutationFn: async (responseValue: any) => {
      return apiRequest('POST', `/api/game-sessions/${sessionId}/responses`, {
        cardId: card.id,
        responseValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions', sessionId] });
      onResponseSaved();
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

  const handleSaveResponse = () => {
    let responseValue: any;

    if (card.type === 'values') {
      responseValue = selectedValues;
    } else if (card.type === 'choice' || card.type === 'archetype') {
      responseValue = response;
    } else {
      responseValue = response;
    }

    if (!responseValue || (Array.isArray(responseValue) && responseValue.length === 0)) {
      toast({
        title: "Помилка",
        description: "Будь ласка, дайте відповідь перед збереженням",
        variant: "destructive",
      });
      return;
    }

    saveResponseMutation.mutate(responseValue);
  };

  const handleValuesChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedValues(prev => [...prev, value]);
    } else {
      setSelectedValues(prev => prev.filter(v => v !== value));
    }
  };

  const renderResponseInput = () => {
    switch (card.type) {
      case 'archetype':
      case 'choice':
        return (
          <RadioGroup
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          >
            {properties.map((property) => (
              <FormControlLabel
                key={property.id}
                value={property.value}
                control={<Radio />}
                label={property.value}
              />
            ))}
          </RadioGroup>
        );

      case 'values':
        return (
          <FormGroup>
            {properties.map((property) => (
              <FormControlLabel
                key={property.id}
                control={
                  <Checkbox
                    checked={selectedValues.includes(property.value)}
                    onChange={(e) => handleValuesChange(property.value, e.target.checked)}
                  />
                }
                label={property.value}
              />
            ))}
          </FormGroup>
        );

      case 'text':
      case 'reflection':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Введіть вашу відповідь..."
            variant="outlined"
          />
        );

      case 'info':
      case 'complete':
        return (
          <Alert severity="info">
            <Typography>
              Ця картка містить інформацію. Натисніть "Продовжити" для переходу далі.
            </Typography>
          </Alert>
        );

      default:
        return (
          <TextField
            fullWidth
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Введіть вашу відповідь..."
            variant="outlined"
          />
        );
    }
  };

  const getButtonText = () => {
    if (card.type === 'info' || card.type === 'complete') {
      return 'Продовжити';
    }
    return isCompleted ? 'Оновити відповідь' : 'Зберегти відповідь';
  };

  const isValidResponse = () => {
    if (card.type === 'info' || card.type === 'complete') {
      return true;
    }
    if (card.type === 'values') {
      return selectedValues.length > 0;
    }
    return response && response.trim().length > 0;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {card.title}
          </Typography>
          
          {card.content && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {card.content}
            </Typography>
          )}

          {isCompleted && (
            <Chip
              label="Завершено"
              color="success"
              size="small"
              icon={<CheckIcon />}
              sx={{ mb: 2 }}
            />
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          {renderResponseInput()}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveResponse}
          disabled={!isValidResponse() || saveResponseMutation.isPending}
          startIcon={
            saveResponseMutation.isPending ? (
              <CircularProgress size={16} />
            ) : card.type === 'info' || card.type === 'complete' ? (
              <PlayArrowIcon />
            ) : (
              <SaveIcon />
            )
          }
          data-testid={`save-response-${card.id}`}
        >
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}