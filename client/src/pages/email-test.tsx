import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Mail, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('Test');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<any>(null);

  const checkEmailStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-status');
      const data = await response.json();
      setEmailStatus(data);
    } catch (error) {
      console.error('Failed to check email status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBasicEmail = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testVerificationEmail = async () => {
    if (!email || !firstName) {
      alert('Please enter email and first name');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firstName }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0A0A0A] mb-2">Email System Testing</h1>
          <p className="text-gray-600">Test and verify email functionality for PakistanYP</p>
        </div>

        {/* Email Status Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Email System Status
            </CardTitle>
            <CardDescription>
              Check the current status of the email sending system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkEmailStatus} disabled={loading} className="mb-4">
              {loading ? 'Checking...' : 'Check Email Status'}
            </Button>
            
            {emailStatus && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">SendGrid API Key:</span>
                  <Badge variant={emailStatus.sendgridApiKey ? 'default' : 'destructive'}>
                    {emailStatus.sendgridApiKey ? 'Present' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Email Service:</span>
                  <Badge variant={emailStatus.emailServiceStatus === 'working' ? 'default' : 'destructive'}>
                    {emailStatus.emailServiceStatus}
                  </Badge>
                </div>
                {emailStatus.lastError && (
                  <div className="text-red-600 text-sm">
                    <strong>Error:</strong> {emailStatus.lastError}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Last checked: {emailStatus.timestamp}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Testing */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Email Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Basic Email Test
              </CardTitle>
              <CardDescription>
                Send a simple test email to verify basic functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Button onClick={testBasicEmail} disabled={loading || !email} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Verification Email Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verification Email Test
              </CardTitle>
              <CardDescription>
                Test the verification email template and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Input
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Button onClick={testVerificationEmail} disabled={loading || !email || !firstName} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Verification Email'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant={result.success ? 'default' : 'destructive'}>
                <AlertDescription className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {result.message}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>1. Check Status:</strong> First, verify that the email system is properly configured.</p>
              <p><strong>2. Basic Test:</strong> Send a simple test email to confirm SendGrid integration works.</p>
              <p><strong>3. Verification Test:</strong> Test the actual verification email template that users receive.</p>
              <p><strong>4. Check Email:</strong> Look for emails in your inbox (including spam folder).</p>
            </div>
            <Alert>
              <AlertDescription>
                <strong>Note:</strong> Make sure to use a real email address that you can access to verify delivery.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}