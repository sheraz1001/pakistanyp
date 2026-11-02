import React, { useState, useEffect } from 'react';
import { PakistanypMark } from '@/components/brand/pakistanyp-logo';
import { country } from '@shared/country';

export function MobileSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F3]">
      <div className="text-center text-[#0A0A0A]">
        <div className="mb-6 flex justify-center">
          <PakistanypMark size={96} />
        </div>
        <p className="mb-6 text-[15px] text-[#5B6475]">{country.tagline}</p>
        <div className="flex justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#CFE8D8] border-t-[#0B6B2E]"></div>
        </div>
      </div>
    </div>
  );
}
