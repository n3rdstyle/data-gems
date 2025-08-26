import { Search, Download, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ExtensionHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  onImport: () => void;
  itemCount: number;
}

export function ExtensionHeader({ searchQuery, onSearchChange, onExport, onImport, itemCount }: ExtensionHeaderProps) {
  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur-xl sticky top-0 z-20">
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/5 to-accent/10">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NTUzMjk2Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Dennis profile photo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground/95 leading-tight">Dennis</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {itemCount === 0 ? "No personal info stored" : `${itemCount} personal info item${itemCount === 1 ? "" : "s"} stored`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onImport} 
              className="h-9 w-9 p-0 hover:bg-accent/80 transition-colors"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onExport} 
              className="h-9 w-9 p-0 hover:bg-accent/80 transition-colors"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Search your personal infos"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-10 bg-muted/50 border-border/60 hover:border-border transition-colors focus:bg-background/80 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </div>
  );
}