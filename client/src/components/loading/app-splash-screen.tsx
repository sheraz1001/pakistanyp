import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building2, Users, TrendingUp, Heart } from 'lucide-react';
import { PakistanypMark } from '@/components/brand/pakistanyp-logo';
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

interface AppSplashScreenProps {
  onComplete: () => void;
  duration?: number;
  showProgress?: boolean;
}

export default function AppSplashScreen({ 
  onComplete, 
  duration = 3000, 
  showProgress = true 
}: AppSplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    { icon: MapPin, text: localize("Connecting to Pakistan Business Network"), duration: 800 },
    { icon: Building2, text: "Loading Business Directory", duration: 700 },
    { icon: Users, text: "Preparing User Experience", duration: 600 },
    { icon: TrendingUp, text: "Optimizing Performance", duration: 500 },
    { icon: Heart, text: "Ready to Connect!", duration: 400 }
  ];

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;

    if (showProgress) {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(onComplete, 200);
            return 100;
          }
          return prev + (100 / (duration / 50));
        });
      }, 50);
    }

    // Step progression
    const stepDuration = duration / loadingSteps.length;
    loadingSteps.forEach((step, index) => {
      stepTimeout = setTimeout(() => {
        setCurrentStep(index);
      }, stepDuration * index);
    });

    // Auto complete
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
      clearTimeout(completeTimeout);
    };
  }, [duration, onComplete, showProgress]);

  const currentStepData = loadingSteps[currentStep];
  const IconComponent = currentStepData?.icon || MapPin;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#FAF8F3]"
      >
        <div className="relative z-10 mx-auto w-full max-w-sm px-6 text-center text-[#0A0A0A]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <PakistanypMark size={96} />
          </motion.div>

          <div className="mb-8">
            <h1 className="mb-2 text-[28px] font-bold tracking-[-0.035em]">
              {country.tagline}
            </h1>
            <p className="text-[15px] text-[#5B6475]">
              {tx("Connecting You with the Best of {0}", country.name)}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-[#3A4354]">
            <IconComponent className="h-4 w-4 text-[#0B6B2E]" />
            <span>{currentStepData?.text || "Loading..."}</span>
          </div>

          {showProgress && (
            <div className="mb-8">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E9EE]">
                <motion.div
                  className="h-full rounded-full bg-[#0B6B2E]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 text-xs font-medium text-[#5B6475]">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          <div className="text-xs text-[#5B6475]">
            Version 2.0
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Quick splash for fast loading
export function QuickSplash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F3]"
    >
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <PakistanypMark size={72} />
        </div>
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#CFE8D8] border-t-[#0B6B2E]" />
      </div>
    </motion.div>
  );
}