import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function MobileOfflineIndicator() {
  // Default to true for SSR (navigator is not available on server)
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // SSR guard - useEffect only runs on client but adding explicit check for robustness
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    // Check actual online status on client
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <Card className="fixed top-4 start-4 end-4 z-50 shadow-lg border-[#E7E9EE] bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900">
              {isOnline ? 'Connection Restored' : 'You\'re Offline'}
            </h3>
            <p className="text-sm text-gray-600">
              {isOnline 
                ? 'Your connection has been restored'
                : 'Some features may not work properly'
              }
            </p>
          </div>
          {!isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}