'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { AnalysisState } from '@/types/keyword-analysis';

interface AnalysisProcessProps {
  isAnalyzing: boolean;
  analysisState: AnalysisState;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function AnalysisProcessComponent({ 
  isAnalyzing, 
  analysisState, 
  onCancel, 
  onRetry 
}: AnalysisProcessProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [isAnalyzing]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (analysisState.status) {
      case 'processing':
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (analysisState.status) {
      case 'uploading':
        return 'Uploading data to server...';
      case 'processing':
        return analysisState.message || 'Analyzing keywords...';
      case 'completed':
        return 'Analysis completed successfully!';
      case 'error':
        return analysisState.message || 'An error occurred during analysis';
      default:
        return 'Ready to start analysis';
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { name: 'Upload', status: 'idle' as 'idle' | 'active' | 'completed' | 'error' },
      { name: 'Process', status: 'idle' as 'idle' | 'active' | 'completed' | 'error' },
      { name: 'Analyze', status: 'idle' as 'idle' | 'active' | 'completed' | 'error' },
      { name: 'Complete', status: 'idle' as 'idle' | 'active' | 'completed' | 'error' },
    ];

    if (analysisState.status === 'uploading') {
      steps[0].status = 'active';
    } else if (analysisState.status === 'processing') {
      steps[0].status = 'completed';
      if (analysisState.progress < 33) {
        steps[1].status = 'active';
      } else if (analysisState.progress < 66) {
        steps[1].status = 'completed';
        steps[2].status = 'active';
      } else {
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'active';
      }
    } else if (analysisState.status === 'completed') {
      steps.forEach(step => step.status = 'completed');
    } else if (analysisState.status === 'error') {
      const errorIndex = Math.floor(analysisState.progress / 25);
      for (let i = 0; i < errorIndex; i++) {
        steps[i].status = 'completed';
      }
      if (errorIndex < steps.length) {
        steps[errorIndex].status = 'error';
      }
    }

    return steps;
  };

  if (analysisState.status === 'idle') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Analysis Progress
        </CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{analysisState.progress}%</span>
          </div>
          <Progress 
            value={analysisState.progress} 
            className={`h-2 ${
              analysisState.status === 'processing' && elapsedTime > 20 
                ? 'animate-pulse' 
                : ''
            }`}
          />
        </div>

        <div className="flex justify-center space-x-4">
          {getProgressSteps().map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${step.status === 'active' ? 'bg-blue-500 text-white' : ''}
                  ${step.status === 'error' ? 'bg-red-500 text-white' : ''}
                  ${step.status === 'idle' ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {step.status === 'completed' ? '✓' : index + 1}
              </div>
              <span className="text-xs mt-1">{step.name}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          {analysisState.estimatedTimeRemaining ? (
            <span>Est. remaining: {formatTime(analysisState.estimatedTimeRemaining)}</span>
          ) : (
            analysisState.status === 'processing' && elapsedTime > 30 && (
              <span className="flex items-center gap-1 text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Still processing...
              </span>
            )
          )}
        </div>

        {analysisState.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {analysisState.message || 'An error occurred during analysis. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {isAnalyzing && onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel Analysis
            </Button>
          )}
          {analysisState.status === 'error' && onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
            >
              Retry Analysis
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}