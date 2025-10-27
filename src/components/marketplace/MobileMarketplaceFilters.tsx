import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Filter, Search } from '@/lib/icons';

interface MobileMarketplaceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedTier: string;
  setSelectedTier: (tier: string) => void;
  categories: any[];
}

export function MobileMarketplaceFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedTier,
  setSelectedTier,
  categories
}: MobileMarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tiers = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum'];

  return (
    <div className="space-y-3 mb-4">
      {/* Mobile Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full justify-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {(selectedCategory !== 'All' || selectedTier !== 'All') && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {[selectedCategory !== 'All' ? 1 : 0, selectedTier !== 'All' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Services</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Consultant Tier</label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedTier('All');
                }}
              >
                Clear All
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}