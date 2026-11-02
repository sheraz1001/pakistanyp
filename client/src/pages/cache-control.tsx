
import React from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { CacheControlPanel } from '@/components/cache-control-panel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CacheControl() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0A0A0A] mb-4">
              Cache Management
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Clear various types of application cache to resolve issues and improve performance.
            </p>
          </div>
        </div>

        <CacheControlPanel />
      </div>

      <Footer />
    </div>
  );
}
