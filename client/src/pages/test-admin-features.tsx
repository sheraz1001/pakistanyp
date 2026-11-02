import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, X, AlertCircle } from 'lucide-react';

export default function TestAdminFeatures() {
  const [testResults, setTestResults] = useState<Record<string, { status: 'testing' | 'success' | 'error'; message?: string }>>({});
  const { toast } = useToast();

  const adminEndpoints = [
    { name: 'Pending Businesses', endpoint: '/api/admin/pending-businesses', method: 'GET' },
    { name: 'Business Categories', endpoint: '/api/admin/categories/all', method: 'GET' },
    { name: 'Verification Requests', endpoint: '/api/admin/verification-requests', method: 'GET' },
    { name: 'All Pages', endpoint: '/api/admin/pages', method: 'GET' },
  ];

  const testEndpoint = async (name: string, endpoint: string, method: string) => {
    setTestResults(prev => ({ ...prev, [name]: { status: 'testing' } }));
    
    try {
      const response = await apiRequest(endpoint, { method });
      setTestResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: 'success', 
          message: `Received ${Array.isArray(response) ? response.length : 'data'} items` 
        } 
      }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: 'error', 
          message: error.message || 'Failed to fetch data' 
        } 
      }));
    }
  };

  const runAllTests = async () => {
    for (const { name, endpoint, method } of adminEndpoints) {
      await testEndpoint(name, endpoint, method);
    }
    toast({
      title: "Tests Complete",
      description: "All admin endpoint tests have been executed",
    });
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Features Test Dashboard</h1>
        
        <div className="grid gap-4">
          {adminEndpoints.map(({ name }) => (
            <Card key={name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{name}</span>
                  {testResults[name] && (
                    <Badge variant={
                      testResults[name].status === 'success' ? 'default' : 
                      testResults[name].status === 'error' ? 'destructive' : 
                      'secondary'
                    }>
                      {testResults[name].status === 'testing' && <AlertCircle className="w-4 h-4 mr-1" />}
                      {testResults[name].status === 'success' && <Check className="w-4 h-4 mr-1" />}
                      {testResults[name].status === 'error' && <X className="w-4 h-4 mr-1" />}
                      {testResults[name].status}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults[name]?.message && (
                  <p className="text-sm text-muted-foreground">{testResults[name].message}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Button onClick={runAllTests}>Run All Tests Again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/super-admin'}>
            Go to Super Admin
          </Button>
        </div>
      </div>
    </div>
  );
}