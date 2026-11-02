import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BusinessCardSkeleton as DirectoryBusinessCardSkeleton } from "@/components/business-card";
import type { BusinessCardLayout } from "@/components/business-card";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  variant?: 'default' | 'card' | 'list' | 'business' | 'profile';
}

export default function SkeletonLoader({ 
  className = "", 
  lines = 3, 
  showAvatar = false, 
  showImage = false,
  variant = 'default'
}: SkeletonLoaderProps) {
  
  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: { x: "100%" },
  };

  const Shimmer = ({ className }: { className?: string }) => (
    <div className={cn("relative overflow-hidden bg-gray-200 rounded", className)}>
      <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      />
    </div>
  );

  if (variant === 'card') {
    return (
      <div className={cn("p-4 border rounded-lg shadow-sm", className)}>
        {showImage && <Shimmer className="w-full h-48 mb-4" />}
        <div className="space-y-3">
          <Shimmer className="h-6 w-3/4" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <div className="flex space-x-2 rtl:space-x-reverse mt-4">
            <Shimmer className="h-8 w-16 rounded-full" />
            <Shimmer className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'business') {
    return (
      <div className={cn("p-6 border rounded-xl shadow-sm", className)}>
        <div className="flex items-start space-x-4 rtl:space-x-reverse">
          <Shimmer className="w-16 h-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-6 w-2/3" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-3/4" />
            <div className="flex space-x-2 rtl:space-x-reverse mt-4">
              <Shimmer className="h-6 w-12 rounded-full" />
              <Shimmer className="h-6 w-16 rounded-full" />
              <Shimmer className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-4/5" />
          <Shimmer className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse">
            {showAvatar && <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />}
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={cn("p-6 border rounded-xl shadow-sm", className)}>
        <div className="flex items-center space-x-4 rtl:space-x-reverse mb-6">
          <Shimmer className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-6 w-48" />
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-6 w-full" />
          </div>
        </div>
        <div className="space-y-3">
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <Shimmer className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showAvatar && <Shimmer className="w-12 h-12 rounded-full" />}
      {showImage && <Shimmer className="w-full h-48 mb-4" />}
      {[...Array(lines)].map((_, i) => (
        <Shimmer 
          key={i} 
          className={cn(
            "h-4",
            i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// Business Card Skeleton
export function BusinessCardSkeleton({ className, layout }: { className?: string; layout?: BusinessCardLayout }) {
  return <DirectoryBusinessCardSkeleton className={className} layout={layout} />;
}

// Category Card Skeleton
export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-xl shadow-sm", className)}>
      <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
        <SkeletonLoader className="w-12 h-12 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <SkeletonLoader className="h-5 w-3/4 bg-gray-200" />
        </div>
      </div>
      <SkeletonLoader className="h-4 w-full bg-gray-200 mb-2" />
      <SkeletonLoader className="h-4 w-2/3 bg-gray-200" />
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton({ count = 6, layout = "grid" }: { count?: number; layout?: BusinessCardLayout }) {
  return (
    <div className={`grid gap-6 ${layout === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
      {[...Array(count)].map((_, i) => (
        <BusinessCardSkeleton key={i} layout={layout} />
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SkeletonLoader className="w-8 h-8 rounded-lg bg-gray-200" />
            <SkeletonLoader className="w-6 h-6 rounded bg-gray-200" />
          </div>
          <SkeletonLoader className="h-8 w-20 bg-gray-200 mb-2" />
          <SkeletonLoader className="h-4 w-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}