import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-attendance",
  description: "Instant class/meeting roll-call via QR — CSV export, no Google Forms",
  accentHex: "#4a90e2",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
