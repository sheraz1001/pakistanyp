import { useEffect, useState } from 'react';
import { useSearch, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { AuthPage, AuthCard, AuthHeading, AuthIcon, authBtnClass } from '@/components/auth-shell';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const search = useSearch();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiRequest('GET', `/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [search]);

  const handleLoginRedirect = () => {
    setLocation('/login');
  };

  return (
    <AuthPage>
      <AuthCard className="items-center text-center">
        <AuthIcon tone={status === 'error' ? 'red' : 'green'}>
          {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />}
          {status === 'success' && <CheckCircle className="h-6 w-6" aria-hidden="true" />}
          {status === 'error' && <XCircle className="h-6 w-6" aria-hidden="true" />}
        </AuthIcon>

        <AuthHeading
          title={
            <>
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </>
          }
          subtitle={
            <>
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {message}
            </>
          }
        />

        {status !== 'loading' && (
          <Button onClick={handleLoginRedirect} className={authBtnClass}>
            Continue to Login
          </Button>
        )}
      </AuthCard>
    </AuthPage>
  );
}
