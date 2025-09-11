'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface KeywordTagInputProps {
  placeholder?: string;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  className?: string;
}

export function KeywordTagInput({ 
  placeholder = "Type and press Enter...",
  tags,
  onAddTag,
  onRemoveTag,
  className = ""
}: KeywordTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      
      // Don't add duplicate tags
      if (!tags.includes(newTag)) {
        onAddTag(newTag);
      }
      
      setInputValue('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full"
      />
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <span>{tag}</span>
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}