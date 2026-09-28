import { cn } from "@/shared/lib/cn";
import { Button, Tag } from "@/shared/ui";
import type { AssistantSuggestion, SuggestionType } from "../../types";

const TYPE_ICON: Record<SuggestionType, { symbol: string; className: string }> = {
  warning: { symbol: "!", className: "border-amber-line bg-amber-bg text-amber" },
  idea: { symbol: "+", className: "border-accent-line bg-accent-bg text-accent" },
};

type SuggestionCardProps = {
  suggestion: AssistantSuggestion;
  resolved?: boolean;
  onApply: (suggestion: AssistantSuggestion) => void;
  onDismiss: (suggestion: AssistantSuggestion) => void;
};

export function SuggestionCard({ suggestion, resolved = false, onApply, onDismiss }: SuggestionCardProps) {
  const icon = TYPE_ICON[suggestion.type];

  return (
    <article
      aria-disabled={resolved}
      className={cn(
        "mb-2 rounded-md border border-line bg-surface px-[11px] py-2.5",
        resolved && "pointer-events-none opacity-40",
      )}
    >
      <div className="mb-1.5 flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            "mt-px flex size-4 flex-none items-center justify-center rounded border text-tiny font-bold",
            icon.className,
          )}
        >
          {icon.symbol}
        </span>
        <div className="text-body-sm/[1.35] font-medium">{suggestion.title}</div>
        <Tag className="ml-auto">{suggestion.confidence}</Tag>
      </div>
      <div className="text-meta/[1.45] text-muted">{suggestion.description}</div>
      <div className="mt-2 flex gap-1.5">
        <Button variant="primary" size="sm" onClick={() => onApply(suggestion)}>
          Aplicar
        </Button>
        <Button size="sm" onClick={() => onDismiss(suggestion)}>
          Ignorar
        </Button>
      </div>
    </article>
  );
}
