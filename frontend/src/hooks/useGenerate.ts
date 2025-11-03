import { useState, useRef } from 'react';
import { generationsAPI, Generation } from '../utils/api';
import { AxiosError } from 'axios';

interface GenerateOptions {
  image: File;
  prompt: string;
  style: string;
  maxRetries?: number;
}

interface GenerateState {
  isGenerating: boolean;
  error: string | null;
  retryCount: number;
  generation: Generation | null;
}

export const useGenerate = () => {
  const [state, setState] = useState<GenerateState>({
    isGenerating: false,
    error: null,
    retryCount: 0,
    generation: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = async ({
    image,
    prompt,
    style,
    maxRetries = 3,
  }: GenerateOptions): Promise<Generation | null> => {
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
      try {
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          error: null,
          retryCount: currentRetry,
        }));

        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();

        const result = await generationsAPI.create(
          image,
          prompt,
          style,
          abortControllerRef.current.signal
        );

        setState({
          isGenerating: false,
          error: null,
          retryCount: 0,
          generation: result,
        });

        return result;
      } catch (error) {
        // Handle abort
        if (error instanceof Error && error.name === 'CanceledError') {
          setState({
            isGenerating: false,
            error: 'Generation aborted',
            retryCount: 0,
            generation: null,
          });
          return null;
        }

        // Handle model overloaded error
        const axiosError = error as AxiosError<{ message: string }>;
        if (axiosError.response?.status === 503) {
          currentRetry++;
          
          if (currentRetry < maxRetries) {
            setState((prev) => ({
              ...prev,
              error: `Model overloaded. Retrying... (${currentRetry}/${maxRetries})`,
              retryCount: currentRetry,
            }));
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * currentRetry));
            continue;
          } else {
            setState({
              isGenerating: false,
              error: 'Model is currently overloaded. Please try again later.',
              retryCount: currentRetry,
              generation: null,
            });
            return null;
          }
        }

        // Handle other errors
        setState({
          isGenerating: false,
          error: axiosError.response?.data?.message || 'An error occurred',
          retryCount: currentRetry,
          generation: null,
        });
        return null;
      }
    }

    return null;
  };

  const abort = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    ...state,
    generate,
    abort,
  };
};

