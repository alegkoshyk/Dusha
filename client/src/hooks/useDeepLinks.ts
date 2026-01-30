import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { queryClient, apiRequest } from '@/lib/queryClient';

export function useDeepLinks() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      console.log('Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        const path = url.pathname;
        const searchParams = url.searchParams;
        
        if (path === '/dashboard' || path.includes('dashboard')) {
          const authToken = searchParams.get('auth_token');
          
          if (authToken) {
            console.log('Auth token received from OAuth');
            localStorage.setItem('authToken', authToken);
            
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          }
          
          setLocation('/dashboard');
        } else if (path === '/payment/callback') {
          const invoiceId = searchParams.get('invoiceId');
          if (invoiceId) {
            setLocation(`/payment/callback?invoiceId=${invoiceId}`);
          }
        } else if (path.startsWith('/')) {
          setLocation(path + url.search);
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    App.addListener('appUrlOpen', handleDeepLink);

    return () => {
      App.removeAllListeners();
    };
  }, [setLocation]);
}
