import React from "react";
import { PageTransition } from "@/components/ui/page-transition";

export default function WhatsAppSubTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
