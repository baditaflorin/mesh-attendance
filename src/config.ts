import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-attendance",
  displayName: "Field Check-in",
  visualProfile: "field",
  shellLayout: "inset",
  description: "A private, peer-to-peer check-in ledger for the people sharing a room.",
  accentHex: "#d7ab57",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
