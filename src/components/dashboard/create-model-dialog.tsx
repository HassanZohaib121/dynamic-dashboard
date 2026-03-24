"use client";

import { useState, useEffect } from "react";
import { useModels } from "@/hooks/use-models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CreateModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function CreateModelDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateModelDialogProps) {
  const { createModel } = useModels();
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLabel("");
      setName("");
      setNameEdited(false);
      setError(null);
    }
  }, [open]);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!nameEdited) setName(slugify(val));
  };

  const handleNameChange = (val: string) => {
    setName(slugify(val));
    setNameEdited(true);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    try {
      await createModel(name, label);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>New model</DialogTitle>
          <DialogDescription>
            Model name will be used in your API like:
            <span className="font-mono"> /api/{name || "model"} </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="model-label">Label</Label>
            <Input
              id="model-label"
              placeholder="e.g. Products"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <Label htmlFor="model-name">Name</Label>
              <span className="text-xs text-muted-foreground">
                used in API and code
              </span>
            </div>
            <Input
              id="model-name"
              placeholder="e.g. products"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="font-mono text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !label.trim() || !name.trim()}
          >
            {loading ? "Creating…" : "Create model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
