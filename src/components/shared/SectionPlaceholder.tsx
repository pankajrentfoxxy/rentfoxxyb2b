import { PageHeader } from "@/components/shared/PageHeader";

export function SectionPlaceholder({
  title,
  subtitle = "This section will be implemented in Phase 1.",
}: {
  title: string;
  subtitle?: string;
}) {
  return <PageHeader title={title} subtitle={subtitle} />;
}
