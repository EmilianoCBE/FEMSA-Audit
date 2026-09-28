import type { SuggestedState } from "../../types";

export function SuggestedStateNode({ state }: { state: SuggestedState }) {
  return (
    <div
      className="absolute h-[60px] w-[152px] rounded-md border-[1.5px] border-dashed border-accent-line bg-accent-bg/60 px-[11px] py-[9px]"
      style={{ left: state.position.x, top: state.position.y }}
    >
      <div className="text-tiny font-semibold text-accent uppercase">{state.kind}</div>
      <div className="text-body-sm font-medium text-accent">{state.name}</div>
    </div>
  );
}
