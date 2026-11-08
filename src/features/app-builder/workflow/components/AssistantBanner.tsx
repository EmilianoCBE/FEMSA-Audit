import { Button } from "@/shared/ui";

type AssistantBannerProps = {
  /** Inconsistencias que siguen en el flujo (US16). */
  inconsistencies: number;
  onReview: () => void;
};

export function AssistantBanner({ inconsistencies, onReview }: AssistantBannerProps) {
  if (inconsistencies === 0) {
    return (
      <div
        role="status"
        className="mx-6 mt-4 flex items-center gap-[9px] rounded-md border border-green-line bg-green-bg px-3 py-[9px] text-body-sm text-green"
      >
        <strong aria-hidden>✓</strong>
        El asistente no encontró inconsistencias en este flujo.
      </div>
    );
  }
  return (
    <div
      role="status"
      className="mx-6 mt-4 flex items-center gap-[9px] rounded-md border border-amber-line bg-amber-bg px-3 py-[9px] text-body-sm text-amber"
    >
      <strong aria-hidden>!</strong>
      El asistente detectó {inconsistencies} {inconsistencies === 1 ? "inconsistencia" : "inconsistencias"} en este
      flujo.
      <Button variant="link" size="sm" className="ml-auto text-amber" onClick={onReview}>
        Revisar
      </Button>
    </div>
  );
}
