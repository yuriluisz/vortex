"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, QrCode } from "lucide-react";

const TABS = [
  { segment: "/broadcast", label: "Central de Disparos", icon: MessageSquare },
  { segment: "/logs", label: "Logs & Relatórios", icon: FileText },
  { segment: "/config", label: "Conexão WhatsApp", icon: QrCode },
];

export function WhatsAppTabs() {
  const pathname = usePathname();
  const basePath = `/admin/whatsapp`;

  return (
    <div className="mb-6 border-b border-border/60 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="-mb-px flex space-x-2 sm:space-x-3 min-w-max pb-2 px-1">
        {TABS.map((tab) => {
          const tabPath = `${basePath}${tab.segment}`;
          const isActive = pathname.startsWith(tabPath);

          return (
            <Link
              key={tab.segment}
              href={tabPath}
              className={`whitespace-nowrap py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
