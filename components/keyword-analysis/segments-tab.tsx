"use client";

import { useState, useMemo, useCallback } from "react";
import { Download } from "lucide-react";
import { AvailableKeywordsPanel } from "./available-keywords-panel";
import { SegmentsList } from "./segments-list";
import { CreateSegmentDialog } from "./create-segment-dialog";
import { EditSegmentDialog } from "./edit-segment-dialog";
import { Button } from "@/components/ui/button";
import type { GroupedKeywordResult, Segment } from "@/types/keyword-analysis";
import { toast } from "sonner";
import { exportSegmentsToCSV } from "@/lib/utils/csv-export";

interface SegmentsTabProps {
  groups: GroupedKeywordResult[];
  segments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
}

export function SegmentsTab({
  groups,
  segments,
  onSegmentsChange,
}: SegmentsTabProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [segmentToEdit, setSegmentToEdit] = useState<Segment | null>(null);

  // Calculate available keywords (not in any segment)
  const assignedKeywords = useMemo(() => {
    const assigned = new Set<string>();
    segments.forEach((segment) => {
      segment.keywords.forEach((keyword) => assigned.add(keyword));
    });
    return assigned;
  }, [segments]);

  const availableKeywords = useMemo(() => {
    return groups.filter(
      (group) => !assignedKeywords.has(group.parent.keyword)
    );
  }, [groups, assignedKeywords]);

  const handleCreateSegment = useCallback(() => {
    if (selectedKeywords.size === 0) {
      toast.error("Please select at least one keyword");
      return;
    }
    setCreateDialogOpen(true);
  }, [selectedKeywords.size]);

  const handleConfirmCreate = useCallback(
    (name: string) => {
      const newSegment: Segment = {
        id: crypto.randomUUID(),
        name,
        keywords: Array.from(selectedKeywords),
        createdAt: new Date(),
      };

      onSegmentsChange([...segments, newSegment]);
      setSelectedKeywords(new Set());
      toast.success(`Created segment "${name}" with ${selectedKeywords.size} keywords`);
    },
    [selectedKeywords, segments, onSegmentsChange]
  );

  const handleEditSegment = useCallback((segment: Segment) => {
    setSegmentToEdit(segment);
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    (id: string, newName: string, keywords: string[]) => {
      const updatedSegments = segments.map((segment) => {
        if (segment.id === id) {
          return {
            ...segment,
            name: newName,
            keywords,
          };
        }
        return segment;
      });

      onSegmentsChange(updatedSegments);
      toast.success(`Updated segment "${newName}"`);
    },
    [segments, onSegmentsChange]
  );

  const handleDeleteSegment = useCallback(
    (segmentId: string) => {
      const segment = segments.find((s) => s.id === segmentId);
      if (!segment) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete the segment "${segment.name}"? The ${segment.keywords.length} keywords will return to the available pool.`
      );

      if (confirmed) {
        const updatedSegments = segments.filter((s) => s.id !== segmentId);
        onSegmentsChange(updatedSegments);
        toast.success(`Deleted segment "${segment.name}"`);
      }
    },
    [segments, onSegmentsChange]
  );

  const handleAddToSegment = useCallback(
    (segmentId: string) => {
      if (selectedKeywords.size === 0) {
        toast.error("Please select keywords to add to the segment");
        return;
      }

      const segment = segments.find((s) => s.id === segmentId);
      if (!segment) return;

      const updatedSegments = segments.map((s) => {
        if (s.id === segmentId) {
          const newKeywords = [
            ...s.keywords,
            ...Array.from(selectedKeywords),
          ];
          return {
            ...s,
            keywords: newKeywords,
          };
        }
        return s;
      });

      onSegmentsChange(updatedSegments);
      setSelectedKeywords(new Set());
      toast.success(
        `Added ${selectedKeywords.size} keywords to segment "${segment.name}"`
      );
    },
    [selectedKeywords, segments, onSegmentsChange]
  );

  const handleExportSegments = useCallback(() => {
    const assignedCount = segments.reduce((sum, seg) => sum + seg.keywords.length, 0);

    if (assignedCount === 0) {
      toast.error("No segmented keywords to export. Create segments first.");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `keyword-segments-${timestamp}.csv`;

    exportSegmentsToCSV(groups, segments, filename);

    const segmentCount = segments.length;

    toast.success(
      `Exported ${assignedCount} segmented keyword${assignedCount !== 1 ? "s" : ""} across ${segmentCount} segment${segmentCount !== 1 ? "s" : ""}`
    );
  }, [groups, segments]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleExportSegments}
          variant="outline"
          className="gap-2"
          disabled={segments.length === 0}
        >
          <Download className="h-4 w-4" />
          Export Segmented Keywords
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-350px)]">
      <AvailableKeywordsPanel
        availableKeywords={availableKeywords}
        selectedKeywords={selectedKeywords}
        onSelectionChange={setSelectedKeywords}
        onCreateSegment={handleCreateSegment}
      />

      <SegmentsList
        segments={segments}
        groups={groups}
        onEditSegment={handleEditSegment}
        onDeleteSegment={handleDeleteSegment}
        onAddToSegment={handleAddToSegment}
      />

      <CreateSegmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedCount={selectedKeywords.size}
        onConfirm={handleConfirmCreate}
      />

      <EditSegmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        segment={segmentToEdit}
        onSave={handleSaveEdit}
      />
      </div>
    </div>
  );
}
