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
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
      >
        <Plus className="w-4 h-4" />
        Publicar Template
      </button>

      {open && (
        <PublishModal campaigns={campaigns} onClose={() => setOpen(false)} />
      )}
    </>
  );
}