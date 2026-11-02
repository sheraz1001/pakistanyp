import { country, localize } from "@shared/country";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";

export default function NewsletterUnsubscribe() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribeFromNewsletter = async () => {
      // Extract token from URL
      const token = location.split('/newsletter-unsubscribe/')[1];
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid unsubscribe link');
        return;
      }

      try {
        const response = await fetch(`/api/newsletter/unsubscribe/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Successfully unsubscribed from newsletter');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to unsubscribe');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    unsubscribeFromNewsletter();
  }, [location]);

  const goHome = () => {
    window.location.href = '/';
  };

  const subscribeAgain = () => {
    window.location.href = '/#newsletter';
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
          {status === 'loading' && 'Processing Unsubscribe...'}
          {status === 'success' && 'Successfully Unsubscribed'}
          {status === 'error' && 'Unsubscribe Failed'}
        </h1>

        {/* Status Message */}
        <p className="text-[#4B5565] mb-8 leading-relaxed">
          {status === 'loading' && 'Please wait while we process your unsubscribe request.'}
          {status === 'success' && (
            <>
              {message}
              <br />
              <br />
              You will no longer receive our business newsletter. We're sorry to see you go!
            </>
          )}
          {status === 'error' && message}
        </p>

        {/* Success Message */}
        {status === 'success' && (
          <div className="yp-panel p-4 mb-8 text-left">
            <h3 className="font-semibold text-[#0A0A0A] mb-2">We'll Miss You!</h3>
            <p className="text-sm text-[#3A4354]">
              {localize("Your unsubscribe request has been processed. If you change your mind, you can always subscribe again to stay updated with Pakistani business news and opportunities.")}
            </p>
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
              onClick={subscribeAgain}
              variant="outline"
              className="w-full h-12 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Subscribe Again
            </Button>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={() => window.location.href = `mailto:admin@${country.domain}?subject=Newsletter Unsubscribe Issue`}
              variant="outline"
              className="w-full h-12 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
          )}
        </div>

        {/* Alternative Options */}
        {status === 'success' && (
          <div className="mt-6 p-4 yp-panel text-left">
            <h4 className="font-medium text-gray-800 mb-2">Stay Connected</h4>
            <p className="text-sm text-gray-600 mb-3">
              Even without our newsletter, you can still:
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Visit our business directory anytime</div>
              <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Read our latest news and blog posts</div>
              <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#0B6B2E]" />Follow us on social media</div>
            </div>
          </div>
        )}

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