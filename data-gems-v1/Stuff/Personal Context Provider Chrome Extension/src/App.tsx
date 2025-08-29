import { useState, useEffect, useMemo } from "react";
import { ExtensionHeader } from "./components/ExtensionHeader";
import { ContextItemForm, ContextItem } from "./components/ContextItemForm";
import { ContextItemCard } from "./components/ContextItemCard";
import { CategoryFilter } from "./components/CategoryFilter";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { DiamondIcon3D } from "./components/DiamondIcon3D";
import { GradientBlobBackground } from "./components/GradientBlobBackground";

export default function App() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ContextItem | null>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("personal-context-items");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const itemsWithDates = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
        setItems(itemsWithDates);
      } catch (error) {
        console.error("Failed to parse stored items:", error);
      }
    }
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("personal-context-items", JSON.stringify(items));
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Get unique categories and their counts
  const categoryData = useMemo(() => {
    const categories = [...new Set(items.map(item => item.category))].sort();
    const counts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { categories, counts };
  }, [items]);

  const handleSaveItem = (itemData: Omit<ContextItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    
    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...itemData, id: editingItem.id, createdAt: editingItem.createdAt, updatedAt: now }
          : item
      ));
      setEditingItem(null);
      toast("Context updated successfully!");
    } else {
      // Add new item
      const newItem: ContextItem = {
        ...itemData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      setItems(prev => [newItem, ...prev]);
      setIsAddingItem(false);
      toast("Context added successfully!");
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast("Context deleted successfully!");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personal-context-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast("Context exported successfully!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            if (Array.isArray(imported)) {
              const itemsWithDates = imported.map((item: any) => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                createdAt: new Date(item.createdAt || Date.now()),
                updatedAt: new Date(item.updatedAt || Date.now())
              }));
              setItems(prev => [...itemsWithDates, ...prev]);
              toast(`Imported ${imported.length} context items!`);
            }
          } catch (error) {
            toast("Failed to import file. Please check the format.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-background via-background to-muted/30 flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-accent/20 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <ExtensionHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExport}
          onImport={handleImport}
          itemCount={items.length}
        />

        {(isAddingItem || editingItem) && (
          <ContextItemForm
            item={editingItem || undefined}
            onSave={handleSaveItem}
            onCancel={() => {
              setIsAddingItem(false);
              setEditingItem(null);
            }}
          />
        )}

        {items.length > 0 && (
          <CategoryFilter
            categories={categoryData.categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            itemCounts={categoryData.counts}
          />
        )}

        <div className="flex-1 flex flex-col">
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-64">
                <div className="relative">
                  <div className="relative w-20 h-20 mx-auto rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden">
                    <GradientBlobBackground />
                    <div className="relative z-10">
                      <DiamondIcon3D className="h-12 w-12 text-white/90 drop-shadow-sm" />
                    </div>
                  </div>

                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground/90">
                    {items.length === 0 ? "Ready to start personalize your AI?" : "No items found"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {items.length === 0 
                      ? "Add your personal info to your profile and help your AI understand you better. No worries, your data stays private and local." 
                      : "Try adjusting your search or filters to find what you're looking for."
                    }
                  </p>
                </div>
                
                {items.length === 0 && (
                  <Button 
                    onClick={() => setIsAddingItem(true)} 
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first info
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredItems.map((item) => (
                  <ContextItemCard
                    key={item.id}
                    item={item}
                    onEdit={setEditingItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
                <div className="h-2" /> {/* Bottom spacing */}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && !isAddingItem && !editingItem && (
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
            <Button 
              onClick={() => setIsAddingItem(true)} 
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm hover:shadow-md transition-all duration-200"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Context
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}