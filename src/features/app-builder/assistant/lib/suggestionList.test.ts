import { describe, expect, it } from "vitest";
import { buildSuggestionListView, sortByPriority } from "./suggestionList";

const items = Array.from({ length: 8 }, (_, index) => ({ id: `s${index + 1}`, rank: index % 3 }));

describe("lista de sugerencias", () => {
  it("ordena por prioridad sin cambiar el orden entre iguales", () => {
    expect(sortByPriority(items, (item) => item.rank).map((item) => item.id)).toEqual([
      "s1",
      "s4",
      "s7",
      "s2",
      "s5",
      "s8",
      "s3",
      "s6",
    ]);
  });

  it("muestra 5 pendientes, separa las decididas y abre la primera", () => {
    const decided = new Set(["s2"]);
    const view = buildSuggestionListView(items, (item) => decided.has(item.id));
    expect(view.visible.map((item) => item.id)).toEqual(["s1", "s3", "s4", "s5", "s6"]);
    expect(view.hidden).toBe(2);
    expect(view.decided.map((item) => item.id)).toEqual(["s2"]);
    expect(view.expandedId).toBe("s1");
    expect([view.reviewed, view.total]).toEqual([1, 8]);
  });

  it("al decidir la abierta, se abre la siguiente pendiente", () => {
    const view = buildSuggestionListView(items, (item) => item.id === "s1", { expanded: "s1" });
    expect(view.expandedId).toBe("s2");
  });

  it("respeta la que eligió el usuario y que haya cerrado todas", () => {
    expect(buildSuggestionListView(items, () => false, { expanded: "s3" }).expandedId).toBe("s3");
    expect(buildSuggestionListView(items, () => false, { expanded: null }).expandedId).toBeNull();
  });

  it("mostrar más amplía la página y sin pendientes no hay ninguna abierta", () => {
    expect(buildSuggestionListView(items, () => false, { limit: 10 }).hidden).toBe(0);
    const done = buildSuggestionListView(items, () => true);
    expect(done.visible).toEqual([]);
    expect(done.expandedId).toBeNull();
    expect(done.reviewed).toBe(8);
  });
});
