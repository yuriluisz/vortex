"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PublishModal } from "./publish-modal";

interface PublishButtonProps {
  campaigns: { id: string; name: string }[];
}

export function PublishButton({ campaigns }: PublishButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-[0.97]"
      >
        <Plus className="w-4 h-4" />
        Publicar novo template
      </button>

      {open && (
        <PublishModal campaigns={campaigns} onClose={() => setOpen(false)} />
      )}
    </>
  );
}