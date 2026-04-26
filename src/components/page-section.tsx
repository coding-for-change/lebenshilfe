import type { ReactNode } from "react";

type PageSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageSection({
  title,
  action,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">{children}</div>
    </section>
  );
}
