import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from "recharts";
import {
  Monitor, Server, Database, Wifi, AlertTriangle, CheckCircle, XCircle,
  Clock, Cpu, MemoryStick, HardDrive, Activity, RefreshCw, Zap,
  Globe, Shield, Bell, TrendingUp, TrendingDown, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  databaseConnections: {
    active: number;
    idle: number;
    total: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errors: {
    count: number;
    rate: number;
  };
  timestamp: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastCheck: string;
  uptime: number;
  description: string;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: string;
  source: string;
  details?: any;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  lastTriggered?: string;
  description: string;
}

export function SystemMonitor() {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Fetch system health data
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["/api/admin/system-health"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system-health", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      return response.json();
    },
    refetchInterval: refreshInterval * 1000
  });

  // Fetch service statuses
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ["/api/admin/services-status"],
    queryFn: async () => {
      const response = await fetch("/api/admin/services-status", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services status');
      }
      return response.json();
    },
    refetchInterval: refreshInterval * 1000
  });

  // Fetch system logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/admin/system-logs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system-logs", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch system logs');
      }
      return response.json();
    },
    refetchInterval: refreshInterval * 1000
  });

  // Fetch performance metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/admin/performance-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/performance-metrics", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      return response.json();
    },
    refetchInterval: refreshInterval * 1000
  });

  const isLoading = healthLoading || servicesLoading || logsLoading || metricsLoading;

  const refetchAll = () => {
    refetchHealth();
    refetchServices();
    refetchLogs();
    refetchMetrics();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-[#B45309] bg-[#FFF4E0]';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-600" />
            System Monitor
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time system health, performance metrics, and service monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Refresh every {refreshInterval}s
          </div>

          <Button
            variant="outline"
            onClick={refetchAll}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Badge 
            variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            {getStatusIcon(systemHealth?.status || 'unknown')}
            System {systemHealth?.status || 'Unknown'}
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Server Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {systemHealth ? formatUptime(systemHealth.uptime) : '--'}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold">
                  {systemHealth ? `${systemHealth.memoryUsage.percentage}%` : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {systemHealth ? formatBytes(systemHealth.memoryUsage.used) : '--'} / {systemHealth ? formatBytes(systemHealth.memoryUsage.total) : '--'}
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={systemHealth?.memoryUsage.percentage || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold">
                  {systemHealth ? `${systemHealth.cpuUsage}%` : '--'}
                </p>
              </div>
              <Cpu className="h-8 w-8 text-[#B45309]" />
            </div>
            <Progress 
              value={systemHealth?.cpuUsage || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">DB Connections</p>
                <p className="text-2xl font-bold text-purple-600">
                  {systemHealth ? systemHealth.databaseConnections.active : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {systemHealth ? systemHealth.databaseConnections.idle : '--'} idle
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Response Time Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {systemHealth ? `${systemHealth.responseTime.average}ms` : '--'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">95th Percentile</p>
                  <p className="text-2xl font-bold text-[#B45309]">
                    {systemHealth ? `${systemHealth.responseTime.p95}ms` : '--'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">99th Percentile</p>
                  <p className="text-2xl font-bold text-red-600">
                    {systemHealth ? `${systemHealth.responseTime.p99}ms` : '--'}
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Response Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Error Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* System Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="cpuUsage" 
                        stackId="1"
                        stroke="#F59E0B" 
                        fill="#FCD34D"
                        name="CPU %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        stackId="2"
                        stroke="#3B82F6" 
                        fill="#93C5FD"
                        name="Memory %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">Total Errors (24h)</p>
                      <p className="text-2xl font-bold text-red-600">
                        {systemHealth ? systemHealth.errors.count : '--'}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-800">Error Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {systemHealth ? `${systemHealth.errors.rate}%` : '--'}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Service Status
              </CardTitle>
              <CardDescription>
                Monitor the health and availability of all system services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services?.map((service: ServiceStatus, index: number) => (
                  <div key={service.name || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {service.responseTime}ms • Uptime: {formatUptime(service.uptime)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Last check: {format(new Date(service.lastCheck), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requestCount" fill="#3B82F6" name="Requests" />
                    <Bar dataKey="activeUsers" fill="#10B981" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs?.map((log: SystemLog, index: number) => (
                    <div key={log.id || index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={log.level === 'error' || log.level === 'critical' ? 'destructive' : 'outline'}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{log.message}</p>
                      <p className="text-xs text-gray-500">Source: {log.source}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Rules & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-[#FFF8EB] border border-[#FBE3B5] rounded-lg">
                  <h3 className="font-medium text-[#7C4A03]">Memory Usage Alert</h3>
                  <p className="text-sm text-[#7C4A03] mt-1">
                    Triggers when memory usage exceeds 80%
                  </p>
                  <Badge variant="outline" className="mt-2">Active</Badge>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800">Database Connection Alert</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Triggers when database connections exceed 90% of pool
                  </p>
                  <Badge variant="destructive" className="mt-2">Critical</Badge>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800">Response Time Alert</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Triggers when average response time exceeds 1000ms
                  </p>
                  <Badge variant="outline" className="mt-2">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}