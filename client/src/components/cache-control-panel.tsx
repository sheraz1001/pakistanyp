
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Info, Database, HardDrive, Globe } from 'lucide-react';
import { CacheManager } from '@/utils/cache-manager';
import { useQueryClient } from '@tanstack/react-query';

export function CacheControlPanel() {
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  const updateCacheInfo = async () => {
    const info = await CacheManager.getCacheInfo();
    setCacheInfo(info);
  };

  useEffect(() => {
    updateCacheInfo();
  }, []);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await CacheManager.clearAllCache(queryClient);
      await updateCacheInfo();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearSpecific = async (type: string) => {
    setIsClearing(true);
    try {
      switch (type) {
        case 'localStorage':
          localStorage.clear();
          break;
        case 'sessionStorage':
          sessionStorage.clear();
          break;
        case 'serviceWorker':
          await CacheManager.clearServiceWorkerCache();
          break;
        case 'reactQuery':
          queryClient.clear();
          break;
      }
      await updateCacheInfo();
    } catch (error) {
      console.error(`Error clearing ${type}:`, error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache Control Panel
        </CardTitle>
        <CardDescription>
          Manage and clear different types of application cache
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Information */}
        {cacheInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Local Storage</span>
              </div>
              <Badge variant="secondary">{cacheInfo.localStorage} items</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Session Storage</span>
              </div>
              <Badge variant="secondary">{cacheInfo.sessionStorage} items</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">SW Caches</span>
              </div>
              <Badge variant="secondary">{cacheInfo.caches.length} caches</Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleClearAll}
            disabled={isClearing}
            className="w-full"
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? 'Clearing All Cache...' : 'Clear All Cache'}
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handleClearSpecific('localStorage')}
              disabled={isClearing}
              variant="outline"
              size="sm"
            >
              Clear Local
            </Button>
            
            <Button
              onClick={() => handleClearSpecific('sessionStorage')}
              disabled={isClearing}
              variant="outline"
              size="sm"
            >
              Clear Session
            </Button>
            
            <Button
              onClick={() => handleClearSpecific('serviceWorker')}
              disabled={isClearing}
              variant="outline"
              size="sm"
            >
              Clear SW
            </Button>
            
            <Button
              onClick={() => handleClearSpecific('reactQuery')}
              disabled={isClearing}
              variant="outline"
              size="sm"
            >
              Clear Queries
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Quick Cache Clear Methods</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <kbd>Ctrl + Shift + C</kbd> - Clear all cache via keyboard</li>
            <li>• Add <code>?clearCache=true</code> to URL and refresh</li>
            <li>• Use the buttons above for specific cache types</li>
            <li>• Hard refresh: <kbd>Ctrl + F5</kbd> or <kbd>Ctrl + Shift + R</kbd></li>
          </ul>
        </div>

        <Button 
          onClick={updateCacheInfo}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Cache Info
        </Button>
      </CardContent>
    </Card>
  );
}
