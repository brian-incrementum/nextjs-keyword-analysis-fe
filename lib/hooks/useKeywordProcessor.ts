import { useEffect, useRef, useState, useCallback } from 'react';
import type { KeywordResult, GroupedKeywordResult } from '@/types/keyword-analysis';
import type { WorkerMessage, WorkerResponse } from '@/lib/workers/keyword-processor.worker';

interface ProcessorState {
  isProcessing: boolean;
  progress: number;
  message: string;
  error: string | null;
}

interface ProcessorResult {
  processKeywords: (
    keywords: KeywordResult[],
    keywordMeta?: Record<string, { searchVolume?: number }>
  ) => Promise<{ results: KeywordResult[], groups: GroupedKeywordResult[] }>;
  cancelProcessing: () => void;
  state: ProcessorState;
}

export function useKeywordProcessor(): ProcessorResult {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<ProcessorState>({
    isProcessing: false,
    progress: 0,
    message: '',
    error: null
  });

  // Initialize worker on mount
  useEffect(() => {
    // Create worker using Next.js compatible syntax
    workerRef.current = new Worker(
      new URL('../workers/keyword-processor.worker.ts', import.meta.url)
    );

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const processKeywords = useCallback(
    (keywords: KeywordResult[], keywordMeta?: Record<string, { searchVolume?: number }>) => {
      return new Promise<{ results: KeywordResult[], groups: GroupedKeywordResult[] }>(
        (resolve, reject) => {
          if (!workerRef.current) {
            reject(new Error('Worker not initialized'));
            return;
          }

          setState({
            isProcessing: true,
            progress: 0,
            message: 'Initializing processing...',
            error: null
          });

          // Setup message handler
          const handleMessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, data } = event.data;

            switch (type) {
              case 'PROGRESS':
                setState(prev => ({
                  ...prev,
                  progress: data?.progress || 0,
                  message: data?.message || ''
                }));
                break;

              case 'COMPLETE':
                setState({
                  isProcessing: false,
                  progress: 100,
                  message: 'Processing complete',
                  error: null
                });
                if (data?.results && data?.groups) {
                  resolve({ results: data.results, groups: data.groups });
                }
                // Remove listener after completion
                workerRef.current?.removeEventListener('message', handleMessage);
                break;

              case 'ERROR':
                setState({
                  isProcessing: false,
                  progress: 0,
                  message: '',
                  error: data?.error || 'Processing failed'
                });
                reject(new Error(data?.error || 'Processing failed'));
                workerRef.current?.removeEventListener('message', handleMessage);
                break;

              case 'CANCELLED':
                setState({
                  isProcessing: false,
                  progress: 0,
                  message: 'Processing cancelled',
                  error: null
                });
                reject(new Error('Processing cancelled'));
                workerRef.current?.removeEventListener('message', handleMessage);
                break;
            }
          };

          // Add message listener
          workerRef.current.addEventListener('message', handleMessage);

          // Send message to worker
          const message: WorkerMessage = {
            type: 'PROCESS_KEYWORDS',
            data: { keywords, keywordMeta }
          };
          workerRef.current.postMessage(message);
        }
      );
    },
    []
  );

  const cancelProcessing = useCallback(() => {
    if (workerRef.current && state.isProcessing) {
      const message: WorkerMessage = { type: 'CANCEL' };
      workerRef.current.postMessage(message);
    }
  }, [state.isProcessing]);

  return {
    processKeywords,
    cancelProcessing,
    state
  };
}