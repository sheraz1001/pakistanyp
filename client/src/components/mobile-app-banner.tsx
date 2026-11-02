import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { localize } from "@shared/country";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function MobileAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isStandalone || isFullscreen) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't show banner if dismissed before or app is installed
  if (isInstalled || !showBanner || localStorage.getItem('pwa-banner-dismissed')) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 start-4 end-4 z-50 md:max-w-sm md:end-auto shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{localize("Install PakistanYP App")}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {localize("Add to your home screen for quick access to Pakistan businesses")}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}