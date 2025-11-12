"use client";

import { useState } from "react";
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

interface CreateSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (name: string) => void;
}

export function CreateSegmentDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: CreateSegmentDialogProps) {
  const [segmentName, setSegmentName] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const trimmedName = segmentName.trim();

    if (!trimmedName) {
      setError("Segment name cannot be empty");
      return;
    }

    onConfirm(trimmedName);
    setSegmentName("");
    setError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSegmentName("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Segment</DialogTitle>
          <DialogDescription>
            Create a segment with {selectedCount} selected keyword{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="segment-name">Segment Name</Label>
            <Input
              id="segment-name"
              value={segmentName}
              onChange={(e) => {
                setSegmentName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
              placeholder="Enter segment name..."
              aria-invalid={!!error}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Segment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
