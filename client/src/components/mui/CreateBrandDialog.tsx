import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  InputAdornment,
  Fade,
  Grow,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserBrand } from '@shared/schema';

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandCreated?: (brand: UserBrand) => void;
}

interface BrandFormData {
  name: string;
  description: string;
}

export function CreateBrandDialog({ open, onOpenChange, onBrandCreated }: CreateBrandDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      return await apiRequest('POST', '/api/user/brands', data);
    },
    onSuccess: (brand: UserBrand) => {
      toast({
        title: "Бренд створено",
        description: `Бренд "${brand.name}" успішно створено`,
      });
      setFormData({ name: '', description: '' });
      onBrandCreated?.(brand);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити бренд",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Заповніть назву",
        description: "Назва бренду обов'язкова",
        variant: "destructive",
      });
      return;
    }
    createBrandMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!createBrandMutation.isPending) {
      setFormData({ name: '', description: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Grow}
      TransitionProps={{ timeout: 400 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: 28 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" fontWeight={600}>
              Створити новий бренд
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Додайте інформацію про ваш новий проект
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Stack spacing={3}>
            <Fade in={open} timeout={600}>
              <TextField
                fullWidth
                label="Назва бренду"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Наприклад: Моя компанія"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Fade>

            <Fade in={open} timeout={800}>
              <TextField
                fullWidth
                label="Опис бренду"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Коротко опишіть ваш бренд або проект..."
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Fade>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.100',
              }}
            >
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500, mb: 1 }}>
                💡 Підказка
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Після створення бренду ви зможете розпочати гру "Душа Бренду" для глибокого дослідження 
                вашого проекту через три рівні: Душа, Розум та Тіло.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={createBrandMutation.isPending}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
            }}
          >
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createBrandMutation.isPending || !formData.name.trim()}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {createBrandMutation.isPending ? 'Створюю...' : 'Створити бренд'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}