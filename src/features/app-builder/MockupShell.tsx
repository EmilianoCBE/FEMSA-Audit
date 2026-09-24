import { useEffect, useRef } from "react";
import { mockupBehavior, mockupMarkup } from "./mockupMarkup";

export function MockupShell() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const document = host.ownerDocument;
    const cleanupFns: Array<() => void> = [];

    const on = (selector: string, eventName: string, handler: (event: Event, el: Element) => void) => {
      host.querySelectorAll(selector).forEach((el) => {
        const listener = (event: Event) => handler(event, el);
        el.addEventListener(eventName, listener);
        cleanupFns.push(() => el.removeEventListener(eventName, listener));
      });
    };

    const map = {
      wf: { s: "scr-wf", c: "Workflow" },
      ds: { s: "scr-ds", c: "Designer" },
      inbox: { s: "scr-inbox", c: "Mi bandeja" },
    } as const;

    const showAI = (show: boolean) => {
      const cfgPane = host.querySelector<HTMLElement>("#pane-cfg");
      const aiPane = host.querySelector("#pane-ai");
      if (cfgPane) cfgPane.style.display = show ? "none" : "block";
      aiPane?.classList.toggle("on", show);
      host.querySelectorAll<HTMLElement>("[data-ai]").forEach((button) => {
        button.classList.toggle("on", (button.dataset.ai === "ai") === show);
      });
    };

    on("[data-go]", "click", (_event, el) => {
      const key = (el as HTMLElement).dataset.go as keyof typeof map;
      const cfg = map[key];
      if (!cfg) return;

      host.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
      const screen = host.querySelector(`#${cfg.s}`);
      screen?.classList.add("active");

      const tabs = screen?.querySelectorAll(".subtab") ?? [];
      if (tabs.length) {
        tabs.forEach((tab, index) => tab.classList.toggle("on", index === 0));
        screen?.querySelectorAll(".panel").forEach((panel, index) => panel.classList.toggle("active", index === 0));
      }

      host.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("active"));
      el.classList.add("active");
      if (key === "wf" || key === "ds") host.querySelector("#nav-ab")?.classList.add("active");

      const crumbs = host.querySelector(".crumbs");
      if (crumbs) {
        crumbs.innerHTML = key === "inbox"
          ? '<span>Gestión de auditoría</span><span class="div">/</span><span class="cur" id="crumb-cur">Mi bandeja</span>'
          : `<span>Configuración</span><span class="div">/</span><span>App Builder</span><span class="div">/</span><span class="cur" id="crumb-cur">${cfg.c}</span>`;
      }
    });

    on("[data-ai]", "click", (_event, el) => showAI((el as HTMLElement).dataset.ai === "ai"));
    on("[data-open-ai]", "click", () => showAI(true));

    on(".sugg .sbtn, .sf-item .sbtn", "click", (_event, el) => {
      const card = el.closest<HTMLElement>(".sugg") || el.closest<HTMLElement>(".sf-item");
      if (!card) return;
      card.style.opacity = ".4";
      card.style.pointerEvents = "none";
    });

    on(".subtab", "click", (_event, el) => {
      const tab = el as HTMLElement;
      const screen = tab.closest(".screen");
      if (!screen) return;
      screen.querySelectorAll(".subtab").forEach((item) => item.classList.remove("on"));
      tab.classList.add("on");
      const target = tab.dataset.panel;
      if (target) {
        screen.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
        host.querySelector(`#${target}`)?.classList.add("active");
      }
    });

    on(".sw-sm", "click", (_event, el) => el.classList.toggle("on"));

    return () => cleanupFns.forEach((cleanup) => cleanup());
  }, []);

  return <div ref={hostRef} dangerouslySetInnerHTML={{ __html: mockupMarkup }} />;
}
