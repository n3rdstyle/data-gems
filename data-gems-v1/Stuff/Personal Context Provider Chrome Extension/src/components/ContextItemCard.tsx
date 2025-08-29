import { ContextItem } from "./ContextItemForm";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Edit, Trash2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContextItemCardProps {
  item: ContextItem;
  onEdit: (item: ContextItem) => void;
  onDelete: (id: string) => void;
}

export function ContextItemCard({ item, onEdit, onDelete }: ContextItemCardProps) {
  return (
    <div className="group relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-4 hover:bg-card/80 hover:border-border hover:shadow-md transition-all duration-200">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant="secondary" className="text-xs bg-secondary/80 text-secondary-foreground/90 border-border/30">
            {item.category}
          </Badge>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-7 w-7 p-0 hover:bg-accent/80 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-primary/60 mt-0.5 flex-shrink-0" />
            <h3 className="font-medium text-sm leading-relaxed text-foreground/95">{item.question}</h3>
          </div>
          
          <div className="pl-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
          
          <div className="flex items-center justify-between pl-6 pt-1">
            <p className="text-xs text-muted-foreground/70">
              Updated {formatDistanceToNow(item.updatedAt)} ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}