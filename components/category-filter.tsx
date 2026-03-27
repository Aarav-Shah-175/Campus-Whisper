'use client';

import { Button } from '@/components/ui/button';

const CATEGORIES = [
  'General',
  'Academics',
  'Social',
  'Housing',
  'Food',
  'Events',
  'Help',
];

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (category: string | undefined) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="mb-8 rounded-[1.6rem] border border-border/70 bg-card/75 p-4 shadow-lg shadow-black/5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Browse</p>
        <p className="mt-1 text-sm text-foreground">Follow one lane or scan the whole campus.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedCategory ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => onCategoryChange(undefined)}
        >
          All
        </Button>
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
