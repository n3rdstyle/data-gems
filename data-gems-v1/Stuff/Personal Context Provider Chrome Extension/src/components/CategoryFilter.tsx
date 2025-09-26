import { Button } from "./ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  itemCounts: Record<string, number>;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange, itemCounts }: CategoryFilterProps) {
  const totalCount = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="border-b border-border/50 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className={`h-8 text-xs transition-all duration-200 ${
              selectedCategory === null 
                ? "bg-gradient-to-r from-primary to-primary/90 shadow-sm" 
                : "bg-background/60 border-border/60 hover:bg-background/80 hover:border-border"
            }`}
          >
            All ({totalCount})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className={`h-8 text-xs transition-all duration-200 ${
                selectedCategory === category 
                  ? "bg-gradient-to-r from-primary to-primary/90 shadow-sm" 
                  : "bg-background/60 border-border/60 hover:bg-background/80 hover:border-border"
              }`}
            >
              {category} ({itemCounts[category] || 0})
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}