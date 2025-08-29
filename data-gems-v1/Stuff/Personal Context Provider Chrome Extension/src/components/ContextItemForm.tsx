import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X, Check, Plus, Edit3 } from "lucide-react";

export interface ContextItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContextItemFormProps {
  item?: ContextItem;
  onSave: (item: Omit<ContextItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const categories = [
  "Preferences", 
  "Favorites", 
  "Habits", 
  "Lifestyle", 
  "Work", 
  "Hobbies", 
  "Travel", 
  "Food", 
  "Entertainment",
  "Other"
];

export function ContextItemForm({ item, onSave, onCancel }: ContextItemFormProps) {
  const [category, setCategory] = useState(item?.category || "Preferences");
  const [question, setQuestion] = useState(item?.question || "");
  const [answer, setAnswer] = useState(item?.answer || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    
    onSave({
      category,
      question: question.trim(),
      answer: answer.trim()
    });
  };

  const isEditing = !!item;

  return (
    <div className="border-b border-border/50 bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-accent/20 rounded-lg flex items-center justify-center border border-border/50">
            {isEditing ? <Edit3 className="h-4 w-4 text-primary/80" /> : <Plus className="h-4 w-4 text-primary/80" />}
          </div>
          <div>
            <h2 className="font-medium text-foreground/95">
              {isEditing ? "Edit Context" : "Add New Context"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Update your personal information" : "Share something about yourself"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/90">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 bg-background/60 border-border/60 hover:border-border transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/90">Question/Context</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What's my favorite type of music?"
              className="h-10 bg-background/60 border-border/60 hover:border-border transition-colors focus:bg-background/80 placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/90">Answer</label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g., I love jazz and classical music, especially Miles Davis and Bach"
              className="min-h-20 resize-none bg-background/60 border-border/60 hover:border-border transition-colors focus:bg-background/80 placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Check className="h-4 w-4 mr-2" />
              {isEditing ? "Update" : "Save"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="bg-background/60 border-border/60 hover:bg-background/80 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}