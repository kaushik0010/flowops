// src/components/sidebar/service-config-section.tsx

"use client";

import { type ReactNode } from "react";

export interface ServiceConfigSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ServiceConfigSection({
  title,
  description,
  children,
}: ServiceConfigSectionProps) {
  return (
    <section className="flex flex-col gap-3 py-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}