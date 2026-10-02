import { Button } from "@/shared/ui";
import type { AssistantSummary } from "../types";

type AssistantBannerProps = {
  summary: AssistantSummary;
  onReview: () => void;
};

export function AssistantBanner({ summary, onReview }: AssistantBannerProps) {
  return (
    <div
      role="status"
      className="mx-6 mt-4 flex items-center gap-[9px] rounded-md border border-amber-line bg-amber-bg px-3 py-[9px] text-body-sm text-amber"
    >
      <strong>!</strong>
      El asistente detectó {summary.inconsistencies} inconsistencias y {summary.suggestedRelations} relaciones sugeridas
      en este flujo.
      <Button variant="link" size="sm" className="ml-auto text-amber" onClick={onReview}>
        Revisar
      </Button>
    </div>
  );
}
