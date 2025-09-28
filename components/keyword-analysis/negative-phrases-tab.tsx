'use client';

import { useState, useCallback } from 'react';
import { Copy, Download, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportNegativePhrasesToCSV } from '@/lib/utils/csv-export';

interface NegativePhrasesTabProps {
  phrases: string[] | null;
  isLoading: boolean;
  error: string | null;
}

export function NegativePhrasesTab({ phrases, isLoading, error }: NegativePhrasesTabProps) {
  const [selectedPhrases, setSelectedPhrases] = useState<Set<string>>(new Set());

  const handleCopyAll = useCallback(() => {
    if (!phrases || phrases.length === 0) {
      toast.error('No phrases to copy');
      return;
    }

    const textToCopy = phrases.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`Copied ${phrases.length} negative phrases to clipboard`);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy phrases to clipboard');
    });
  }, [phrases]);

  const handleCopySelected = useCallback(() => {
    if (selectedPhrases.size === 0) {
      toast.error('No phrases selected');
      return;
    }

    const textToCopy = Array.from(selectedPhrases).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`Copied ${selectedPhrases.size} selected phrases to clipboard`);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy phrases to clipboard');
    });
  }, [selectedPhrases]);

  const handleExportCSV = useCallback(() => {
    if (!phrases || phrases.length === 0) {
      toast.error('No phrases to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    exportNegativePhrasesToCSV(phrases, `negative-phrases-${timestamp}.csv`);
    toast.success(`Exported ${phrases.length} negative phrases to CSV`);
  }, [phrases]);

  const handleExportSelectedCSV = useCallback(() => {
    if (selectedPhrases.size === 0) {
      toast.error('No phrases selected');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    exportNegativePhrasesToCSV(Array.from(selectedPhrases), `negative-phrases-selected-${timestamp}.csv`);
    toast.success(`Exported ${selectedPhrases.size} selected phrases to CSV`);
  }, [selectedPhrases]);

  const togglePhraseSelection = useCallback((phrase: string) => {
    setSelectedPhrases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phrase)) {
        newSet.delete(phrase);
      } else {
        newSet.add(phrase);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (phrases) {
      setSelectedPhrases(new Set(phrases));
    }
  }, [phrases]);

  const clearSelection = useCallback(() => {
    setSelectedPhrases(new Set());
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Negative Phrases</CardTitle>
            <CardDescription>
              AI-generated negative keywords to exclude irrelevant searches from your Amazon PPC campaigns
            </CardDescription>
          </div>
          {phrases && phrases.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {phrases.length} phrases
              {selectedPhrases.size > 0 && (
                <span className="ml-2">
                  ({selectedPhrases.size} selected)
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating negative phrases...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (!phrases || phrases.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Negative phrases will appear here once the analysis is complete.
          </p>
        )}

        {phrases && phrases.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCopyAll}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {selectedPhrases.size > 0 && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <Button
                    onClick={handleCopySelected}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Selected
                  </Button>
                  <Button
                    onClick={handleExportSelectedCSV}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </>
              )}
              {selectedPhrases.size !== phrases.length && (
                <Button
                  onClick={selectAll}
                  variant="ghost"
                  size="sm"
                >
                  Select All
                </Button>
              )}
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 max-h-[600px] overflow-y-auto">
              <div className="space-y-1">
                {phrases.map((phrase, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-accent/50 rounded ${
                      selectedPhrases.has(phrase) ? 'bg-blue-500 text-white font-medium hover:bg-blue-600' : ''
                    }`}
                    onClick={() => togglePhraseSelection(phrase)}
                  >
                    {phrase}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How to use these negative phrases:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy or export the phrases using the buttons above</li>
                <li>Navigate to your Amazon Ads campaign settings</li>
                <li>Go to the Negative Keywords section</li>
                <li>Add these phrases as negative phrase match keywords</li>
                <li>This will prevent your ads from showing for these irrelevant searches</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}