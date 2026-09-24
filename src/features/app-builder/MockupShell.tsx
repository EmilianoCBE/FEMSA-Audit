import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { DesignerScreen } from "./screens/DesignerScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { WorkflowScreen } from "./screens/WorkflowScreen";
import type { DesignerTab, Screen, WorkflowTab } from "./types";

export function MockupShell() {
  const [screen, setScreen] = useState<Screen>("workflow");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("flow");
  const [designerTab, setDesignerTab] = useState<DesignerTab>("fields");
  const [showAi, setShowAi] = useState(false);

  const goToScreen = (nextScreen: Screen) => {
    setScreen(nextScreen);
    setShowAi(false);
    if (nextScreen === "workflow") setWorkflowTab("flow");
    if (nextScreen === "designer") setDesignerTab("fields");
  };

  return (
    <div className="shell">
      {/* TODO(US01 - Rafael Valdez): agregar pantalla de acceso con Microsoft Entra ID y bloqueo de usuarios no autorizados. */}
      <Sidebar activeScreen={screen} onNavigate={goToScreen} />
      <main className="main">
        <Topbar activeScreen={screen} />
        {screen === "workflow" && (
          <WorkflowScreen activeTab={workflowTab} onChangeTab={setWorkflowTab} showAi={showAi} onShowAi={setShowAi} />
        )}
        {screen === "designer" && <DesignerScreen activeTab={designerTab} onChangeTab={setDesignerTab} />}
        {screen === "inbox" && <InboxScreen />}
      </main>
    </div>
  );
}

