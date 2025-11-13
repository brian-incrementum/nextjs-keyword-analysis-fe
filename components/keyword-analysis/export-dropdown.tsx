'use client';

// import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileDown, Download, Layers, List, Filter } from 'lucide-react';

interface ExportDropdownProps {
  onExport: (format: 'csv' | 'xlsx', mode: 'flat' | 'grouped' | 'filtered-all' | 'filtered-parents') => void;
  isGroupedView?: boolean;
}

export function ExportDropdown({ onExport, isGroupedView: _isGroupedView = false }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* CSV Export */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export CSV</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onExport('csv', 'flat')}>
              <List className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>All Keywords</span>
                <span className="text-xs text-muted-foreground">Include all variations</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv', 'grouped')}>
              <Layers className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Parent Keywords Only</span>
                <span className="text-xs text-muted-foreground">Highest volume per group</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport('csv', 'filtered-all')}>
              <Filter className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Filtered View - All</span>
                <span className="text-xs text-muted-foreground">Export visible keywords</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv', 'filtered-parents')}>
              <Filter className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Filtered View - Parents</span>
                <span className="text-xs text-muted-foreground">Export visible parents only</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Excel Export */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download className="mr-2 h-4 w-4" />
            <span>Export Excel</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onExport('xlsx', 'flat')}>
              <List className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>All Keywords</span>
                <span className="text-xs text-muted-foreground">Include all variations</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('xlsx', 'grouped')}>
              <Layers className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Parent Keywords Only</span>
                <span className="text-xs text-muted-foreground">Highest volume per group</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport('xlsx', 'filtered-all')}>
              <Filter className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Filtered View - All</span>
                <span className="text-xs text-muted-foreground">Export visible keywords</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('xlsx', 'filtered-parents')}>
              <Filter className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Filtered View - Parents</span>
                <span className="text-xs text-muted-foreground">Export visible parents only</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}