import { useState, useEffect, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  error?: string;
}

export function useLoading(initialState: boolean = false) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialState,
    message: undefined,
    progress: undefined,
    error: undefined
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      message,
      progress: undefined,
      error: undefined
    });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined,
      error: undefined
    });
  }, []);

  const setProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    setProgress,
    setError,
    updateMessage
  };
}

// Hook for managing page transitions with loading states
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<string>('default');

  const startTransition = useCallback((type: string = 'default') => {
    setTransitionType(type);
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    transitionType,
    startTransition,
    endTransition
  };
}

// Hook for managing async operations with loading states
export function useAsyncOperation<T = any>() {
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: string | null;
    progress?: number;
  }>({
    data: null,
    isLoading: false,
    error: null,
    progress: undefined
  });

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options?: {
      onProgress?: (progress: number) => void;
      onError?: (error: string) => void;
    }
  ) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0
    }));

    try {
      // Simulate progress for better UX
      if (options?.onProgress) {
        options.onProgress(25);
      }

      const result = await asyncFunction();

      if (options?.onProgress) {
        options.onProgress(100);
      }

      setState({
        data: result,
        isLoading: false,
        error: null,
        progress: 100
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        progress: undefined
      });

      if (options?.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      progress: undefined
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Hook for managing app initialization with splash screen (DISABLED - no splash screen)
export function useAppInitialization() {
  const [isInitializing] = useState(false);
  const [initializationStep] = useState(0);
  const [initializationMessage] = useState('');

  return {
    isInitializing,
    initializationStep,
    initializationMessage,
    completeInitialization: () => {}
  };
}

// Hook for managing search loading with debounce
export function useSearchLoading(delay: number = 300) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchProgress(0);
    
    // Simulate search progress
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  const completeSearch = useCallback(() => {
    setSearchProgress(100);
    setTimeout(() => {
      setIsSearching(false);
      setSearchProgress(0);
    }, 200);
  }, []);

  return {
    isSearching,
    searchProgress,
    startSearch,
    completeSearch
  };
}

// Hook for managing form submission loading
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);

  const startSubmission = useCallback(() => {
    setIsSubmitting(true);
    setSubmissionProgress(0);
    
    // Simulate submission progress
    const steps = [25, 50, 75, 100];
    steps.forEach((step, index) => {
      setTimeout(() => {
        setSubmissionProgress(step);
      }, (index + 1) * 250);
    });
  }, []);

  const completeSubmission = useCallback(() => {
    setSubmissionProgress(100);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionProgress(0);
    }, 500);
  }, []);

  const resetSubmission = useCallback(() => {
    setIsSubmitting(false);
    setSubmissionProgress(0);
  }, []);

  return {
    isSubmitting,
    submissionProgress,
    startSubmission,
    completeSubmission,
    resetSubmission
  };
}