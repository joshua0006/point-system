import { Badge } from '@/components/ui/badge';

interface ActiveFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedTier: string;
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearTier: () => void;
}

export function ActiveFilters({
  searchTerm,
  selectedCategory,
  selectedTier,
  onClearSearch,
  onClearCategory,
  onClearTier
}: ActiveFiltersProps) {
  const hasActiveFilters = selectedCategory !== "All" || selectedTier !== "All" || searchTerm;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {searchTerm && (
        <Badge variant="secondary" className="px-3 py-1">
          Search: "{searchTerm}"
          <button 
            onClick={onClearSearch}
            className="ml-2 hover:text-destructive"
          >
            ×
          </button>
        </Badge>
      )}
      {selectedCategory !== "All" && (
        <Badge variant="secondary" className="px-3 py-1">
          Category: {selectedCategory}
          <button 
            onClick={onClearCategory}
            className="ml-2 hover:text-destructive"
          >
            ×
          </button>
        </Badge>
      )}
      {selectedTier !== "All" && (
        <Badge variant="secondary" className="px-3 py-1">
          Tier: {selectedTier}
          <button 
            onClick={onClearTier}
            className="ml-2 hover:text-destructive"
          >
            ×
          </button>
        </Badge>
      )}
    </div>
  );
}