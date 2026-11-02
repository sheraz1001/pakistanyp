import { country, localize } from "@shared/country";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";

export default function NewsletterConfirm() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmSubscription = async () => {
      // Extract token from URL
      const token = location.split('/newsletter-confirm/')[1];
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        const response = await fetch(`/api/newsletter/confirm/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email confirmed successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to confirm subscription');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    confirmSubscription();
  }, [location]);

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <FlagStripe />
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-12">
      <PakistanypLogo href="/" />
      <div className="bg-white border border-[#E7E9EE] rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)] max-w-[480px] w-full p-6 sm:p-10 text-center">
        
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#E8F4EC] rounded-[14px]">
              <Loader2 className="w-7 h-7 text-[#0B6B2E] animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#E8F4EC] rounded-[14px]">
              <CheckCircle className="w-7 h-7 text-[#0B6B2E]" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FDECEC] rounded-[14px]">
              <XCircle className="w-7 h-7 text-[#B91C1C]" />
            </div>
          )}
        </div>

        {/* Status Title */}
        <h1 className="text-[28px] leading-[1.15] tracking-[-0.04em] font-bold text-[#0A0A0A] mb-4">
          {status === 'loading' && 'Confirming Subscription...'}
          {status === 'success' && 'Welcome to Our Newsletter!'}
          {status === 'error' && 'Confirmation Failed'}
        </h1>

        {/* Status Message */}
        <p className="text-[#4B5565] mb-8 leading-relaxed">
          {status === 'loading' && 'Please wait while we confirm your subscription.'}
          {status === 'success' && (
            <>
              {message}
              <br />
              <br />
              {localize("You'll start receiving our weekly Pakistani business newsletter with the latest opportunities, news, and insights.")}
            </>
          )}
          {status === 'error' && message}
        </p>

        {/* Success Benefits */}
        {status === 'success' && (
          <div className="yp-tint rounded-[14px] p-4 mb-8 text-left">
            <h3 className="font-semibold text-[#0A0A0A] mb-2">What's Next?</h3>
            <ul className="text-sm text-[#3A4354] space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Weekly business newsletters</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Featured business opportunities</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Market insights and trends</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Government announcements</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={goHome}
            className="w-full h-12 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Button>
          
          {status === 'success' && (
            <Button 
              onClick={() => window.location.href = '/business-directory'}
              variant="outline"
              className="w-full h-12 rounded-xl text-[15px] font-semibold"
            >
              Explore Business Directory
            </Button>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={() => window.location.href = '/#newsletter'}
              variant="outline"
              className="w-full h-12 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Try Subscribing Again
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()}{` ${country.brand}. All rights reserved.`}
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}