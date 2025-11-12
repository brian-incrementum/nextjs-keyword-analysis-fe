'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface ScoreFilterMultiSelectProps {
  selectedScores: string[];
  onScoreChange: (scores: string[]) => void;
}

const scoreRanges = [
  { value: 'high', label: 'High (8-10)', range: [8, 10] },
  { value: 'medium', label: 'Medium (5-7)', range: [5, 7] },
  { value: 'low', label: 'Low (1-4)', range: [1, 4] },
];

export function ScoreFilterMultiSelect({ 
  selectedScores, 
  onScoreChange 
}: ScoreFilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  
  const isAllSelected = selectedScores.length === 0 || selectedScores.includes('all');
  const selectedCount = isAllSelected ? 0 : selectedScores.length;
  
  const handleSelectAll = () => {
    onScoreChange(['all']);
  };
  
  const handleToggleScore = (value: string) => {
    if (value === 'all') {
      onScoreChange(['all']);
      return;
    }
    
    let newScores: string[];
    
    if (isAllSelected) {
      // If "all" is selected, start fresh with just this option
      newScores = [value];
    } else if (selectedScores.includes(value)) {
      // Remove the score
      newScores = selectedScores.filter(s => s !== value);
      // If nothing is selected, default to "all"
      if (newScores.length === 0) {
        newScores = ['all'];
      }
    } else {
      // Add the score
      newScores = [...selectedScores.filter(s => s !== 'all'), value];
    }
    
    onScoreChange(newScores);
  };
  
  const getButtonLabel = () => {
    if (isAllSelected) {
      return 'All Scores';
    }
    if (selectedCount === 1) {
      const selected = scoreRanges.find(r => selectedScores.includes(r.value));
      return selected?.label || 'Score';
    }
    return `${selectedCount} Score Ranges`;
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full h-9 justify-between">
          <span className="truncate">{getButtonLabel()}</span>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel>Filter by Score</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleSelectAll();
          }}
        >
          <div className="flex items-center space-x-2 w-full">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              onClick={(e) => e.stopPropagation()}
            />
            <span>All Scores</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {scoreRanges.map((range) => (
          <DropdownMenuItem
            key={range.value}
            onSelect={(e) => {
              e.preventDefault();
              handleToggleScore(range.value);
            }}
          >
            <div className="flex items-center space-x-2 w-full">
              <Checkbox
                checked={!isAllSelected && selectedScores.includes(range.value)}
                onCheckedChange={() => handleToggleScore(range.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>{range.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}