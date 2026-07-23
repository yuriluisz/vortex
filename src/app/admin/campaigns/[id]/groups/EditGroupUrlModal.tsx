"use client";

import { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { updateGroupUrlAction } from "../../../actions";

interface EditGroupUrlModalProps {
  groupId: string;
  campaignId: string;
  initialUrl: string;
}

export function EditGroupUrlModal({ groupId, campaignId, initialUrl }: EditGroupUrlModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setIsPending(true);
    setError("");
    try {
      await updateGroupUrlAction(groupId, campaignId, url);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar URL");
    } finally {
      setIsPending(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 max-w-[200px] w-full">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-input bg-secondary px-2 py-1 text-xs text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all"
          placeholder="https://chat.whatsapp.com/..."
          disabled={isPending}
          autoFocus
        />
        {error && <span className="text-[10px] text-destructive">{error}</span>}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center justify-center p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setUrl(initialUrl);
              setError("");
            }}
            disabled={isPending}
            className="flex items-center justify-center p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-[200px] group/edit">
      <p className="text-xs text-muted-foreground truncate">{url}</p>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
        title="Editar URL"
      >
        <Edit2 className="h-3 w-3" />
      </button>
    </div>
  );
}
