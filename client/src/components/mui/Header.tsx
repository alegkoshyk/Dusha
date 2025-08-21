import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/ThemeProvider';

export function MuiHeader() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleDashboard = () => {
    setLocation('/');
    handleMenuClose();
  };

  return (
    <AppBar position="fixed" elevation={1}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => setLocation('/')}
        >
          Душа Бренду
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => setLocation('/')}
          >
            Дашборд
          </Button>

          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuClick}
            data-testid="user-menu-button"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || <AccountCircleIcon />}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'Користувач'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleDashboard} data-testid="menu-dashboard">
              <DashboardIcon sx={{ mr: 2 }} />
              Дашборд
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout} data-testid="menu-logout">
              <LogoutIcon sx={{ mr: 2 }} />
              Вийти
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}