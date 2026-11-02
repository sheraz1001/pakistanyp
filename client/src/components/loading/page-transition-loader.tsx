import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Search, Users, Settings, Star, TrendingUp, FileText } from 'lucide-react';
import { country } from "@shared/country";
import { t as tx } from "@shared/i18n";

interface PageTransitionLoaderProps {
  isLoading: boolean;
  pageType?: 'home' | 'search' | 'business' | 'dashboard' | 'profile' | 'categories' | 'provinces' | 'settings';
}

export default function PageTransitionLoader({ isLoading, pageType = 'home' }: PageTransitionLoaderProps) {
  const getPageConfig = () => {
    switch (pageType) {
      case 'search':
        return {
          icon: Search,
          title: "Searching",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'business':
        return {
          icon: Building2,
          title: "Loading Business",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'dashboard':
        return {
          icon: TrendingUp,
          title: "Loading Dashboard",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'profile':
        return {
          icon: Users,
          title: "Loading Profile",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'categories':
        return {
          icon: FileText,
          title: "Loading Categories",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'provinces':
        return {
          icon: MapPin,
          title: tx("Loading {0}", country.regionTerm.plural),
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      case 'settings':
        return {
          icon: Settings,
          title: "Loading Settings",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
      default:
        return {
          icon: Star,
          title: "Loading",
          color: "bg-[#E8F4EC]",
          bgColor: "bg-[#FAF8F3]"
        };
    }
  };

  const config = getPageConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-40 flex items-center justify-center ${config.bgColor}`}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center"
          >
            {/* Animated Icon */}
            <motion.div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-[16px] ${config.color} mb-4`}
            >
              <IconComponent className="w-7 h-7 text-[#0B6B2E]" />
            </motion.div>

            {/* Loading Title */}
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold tracking-[-0.02em] text-[#0A0A0A] mb-2"
            >
              {config.title}
            </motion.h3>

            {/* Animated Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center space-x-1 rtl:space-x-reverse"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-[#0B6B2E] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini loader for buttons and small components
export function MiniLoader({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        className="text-current"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="32"
          className="opacity-30"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="24"
        />
      </svg>
    </motion.div>
  );
}

// Progress bar loader
export function ProgressLoader({ progress = 0, showPercentage = true }: { progress?: number; showPercentage?: boolean }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">Loading...</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-[#E7E9EE] rounded-full h-2">
        <motion.div
          className="bg-[#0B6B2E] h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Card loading state
export function CardLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 border rounded-xl shadow-sm ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}