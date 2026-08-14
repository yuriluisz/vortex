"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { ReviewModal } from "./review-modal";

interface ReviewButtonProps {
  slug: string;
  templateId: string;
}

export function ReviewButton({ slug, templateId }: ReviewButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Revisar
      </button>

      {open && (
        <ReviewModal slug={slug} templateId={templateId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}