import { OnboardingWizard } from '@/components/onboarding-wizard';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => fetch('/api/auth/user').then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    }),
    retry: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login?redirect=onboarding');
    }
  }, [user, isLoading, setLocation]);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user?.onboardingCompleted) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#CFE8D8] border-t-[#0B6B2E]" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <OnboardingWizard />;
}