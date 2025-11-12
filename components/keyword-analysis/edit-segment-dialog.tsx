"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";
import type { Segment } from "@/types/keyword-analysis";

interface EditSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: Segment | null;
  onSave: (id: string, newName: string, keywords: string[]) => void;
}

export function EditSegmentDialog({
  open,
  onOpenChange,
  segment,
  onSave,
}: EditSegmentDialogProps) {
  const [segmentName, setSegmentName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (segment) {
      setSegmentName(segment.name);
      setKeywords([...segment.keywords]);
      setError("");
    }
  }, [segment]);

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const handleSave = () => {
    const trimmedName = segmentName.trim();

    if (!trimmedName) {
      setError("Segment name cannot be empty");
      return;
    }

    if (keywords.length === 0) {
      setError("Segment must contain at least one keyword");
      return;
    }

    if (segment) {
      onSave(segment.id, trimmedName, keywords);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setError("");
    onOpenChange(false);
  };

  if (!segment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Segment</DialogTitle>
          <DialogDescription>
            Rename the segment or remove keywords. Removed keywords will return to the available pool.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-segment-name">Segment Name</Label>
            <Input
              id="edit-segment-name"
              value={segmentName}
              onChange={(e) => {
                setSegmentName(e.target.value);
                setError("");
              }}
              placeholder="Enter segment name..."
              aria-invalid={!!error}
            />
          </div>

          <div className="grid gap-2">
            <Label>Keywords ({keywords.length})</Label>
            <div className="max-h-[300px] overflow-y-auto rounded-md border p-3">
              {keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No keywords in this segment
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 rounded-sm hover:bg-muted p-0.5"
                        title="Remove keyword"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
