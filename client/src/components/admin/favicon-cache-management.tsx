import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Monitor, 
  Smartphone, 
  Globe,
  Activity,
  Zap,
  Settings,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

interface FaviconCacheStatus {
  cacheVersion: string;
  lastCleared: string;
  timestamp: string;
  clearReason: string;
  clearCount: number;
  faviconPath: string;
  isActive: boolean;
  nextScheduledClear: string;
}

export function FaviconCacheManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  // Fetch favicon cache status
  const { data: cacheStatus, isLoading } = useQuery<FaviconCacheStatus>({
    queryKey: ['/api/admin/favicon-cache-status'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time monitoring
  });

  // Manual cache clear mutation
  const clearCacheMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest('POST', '/api/admin/clear-favicon-cache', { reason });
    },
    onMutate: () => {
      setIsClearing(true);
    },
    onSuccess: (data) => {
      toast({
        title: "Cache Cleared Successfully",
        description: `Favicon cache cleared with version ${data.version}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/favicon-cache-status'] });
      
      // Trigger client-side cache clearing
      window.dispatchEvent(new CustomEvent('faviconUpdate'));
    },
    onError: (error: any) => {
      toast({
        title: "Cache Clear Failed",
        description: error.message || "Failed to clear favicon cache",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsClearing(false);
    }
  });

  const handleManualClear = (reason: string) => {
    clearCacheMutation.mutate(reason);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-green-600" : "text-gray-400";
  };

  const getCacheHealthScore = () => {
    if (!cacheStatus) return 0;
    
    const lastClearedTime = new Date(cacheStatus.lastCleared).getTime();
    const now = Date.now();
    const timeSinceLastClear = now - lastClearedTime;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Score based on how recent the last clear was (100% if within 5 minutes)
    const timeScore = Math.max(0, 100 - (timeSinceLastClear / fiveMinutes) * 20);
    
    // Bonus points for high clear count (active management)
    const activityScore = Math.min(20, cacheStatus.clearCount * 2);
    
    return Math.min(100, timeScore + activityScore);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Favicon Cache Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const healthScore = getCacheHealthScore();

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Favicon Cache Management
          </CardTitle>
          <CardDescription>
            Real-time monitoring and control of favicon cache clearing system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cache Health Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache Health Score</span>
              <Badge variant={healthScore > 80 ? "default" : healthScore > 50 ? "secondary" : "destructive"}>
                {healthScore.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={healthScore} className="h-2" />
            <p className="text-xs text-gray-500">
              Based on cache freshness and management activity
            </p>
          </div>

          <Separator />

          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Activity className={`h-6 w-6 mx-auto mb-2 ${getStatusColor(cacheStatus?.isActive || false)}`} />
              <div className="text-sm font-medium">Status</div>
              <div className={`text-xs ${getStatusColor(cacheStatus?.isActive || false)}`}>
                {cacheStatus?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Clear Count</div>
              <div className="text-xs text-gray-600">
                {cacheStatus?.clearCount || 0} times
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">Version</div>
              <div className="text-xs text-gray-600">
                {cacheStatus?.cacheVersion || 'v1'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Settings className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">Reason</div>
              <div className="text-xs text-gray-600">
                {cacheStatus?.clearReason || 'initial'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Detailed Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Cache Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Last Cleared:</strong>
                <br />
                <span className="text-gray-600">
                  {cacheStatus?.lastCleared ? 
                    format(new Date(cacheStatus.lastCleared), 'PPpp') : 'Never'
                  }
                </span>
              </div>
              
              <div>
                <strong>Next Scheduled Clear:</strong>
                <br />
                <span className="text-gray-600">
                  {cacheStatus?.nextScheduledClear ? 
                    format(new Date(cacheStatus.nextScheduledClear), 'PPpp') : 'Not scheduled'
                  }
                </span>
              </div>
              
              <div>
                <strong>Current Favicon:</strong>
                <br />
                <span className="text-gray-600">
                  {cacheStatus?.faviconPath || '/favicon.ico'}
                </span>
              </div>
              
              <div>
                <strong>Cache Timestamp:</strong>
                <br />
                <span className="text-gray-600 font-mono text-xs">
                  {cacheStatus?.timestamp || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Manual Controls */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Manual Cache Control
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleManualClear('manual-admin')}
                disabled={isClearing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isClearing ? 'animate-spin' : ''}`} />
                Clear Now
              </Button>
              
              <Button
                onClick={() => handleManualClear('desktop-app-update')}
                disabled={isClearing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Desktop App Clear
              </Button>
              
              <Button
                onClick={() => handleManualClear('mobile-pwa-update')}
                disabled={isClearing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile PWA Clear
              </Button>
            </div>
          </div>

          <Separator />

          {/* Browser Compatibility Status */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Browser Compatibility
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { name: 'Chrome', icon: '🟢' },
                { name: 'Firefox', icon: '🟢' },
                { name: 'Safari', icon: '🟢' },
                { name: 'Edge', icon: '🟢' },
                { name: 'Mobile Chrome', icon: '🟢' },
                { name: 'Mobile Safari', icon: '🟢' },
                { name: 'PWA/Desktop', icon: '🟢' },
                { name: 'Service Worker', icon: '🟢' }
              ].map((browser) => (
                <div key={browser.name} className="flex items-center gap-1 p-2 bg-gray-50 rounded">
                  <span>{browser.icon}</span>
                  <span>{browser.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#B45309]" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <strong>Automatic Cache Clearing Active</strong>
            </div>
            <p className="text-blue-700">
              The system automatically clears favicon cache when changes are detected, 
              ensuring users always see the latest favicon across all browsers and devices.
            </p>
          </div>
          
          <div className="space-y-2">
            <p><strong>Cache Clear Triggers:</strong></p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Favicon file upload or replacement</li>
              <li>System settings favicon path change</li>
              <li>Manual admin intervention</li>
              <li>Periodic maintenance (every 5 minutes)</li>
              <li>Development mode updates (every 30 seconds)</li>
              <li>Browser tab focus return (for active checking)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p><strong>Cache Types Cleared:</strong></p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Browser favicon cache (all formats)</li>
              <li>Service Worker cache (PWA/Desktop)</li>
              <li>Apple Touch Icon cache (iOS devices)</li>
              <li>Manifest cache (Progressive Web App)</li>
              <li>Proxy and CDN cache (production)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}