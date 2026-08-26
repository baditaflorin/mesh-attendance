# Field Check-in

[![pages](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--attendance-d7ab57)](https://baditaflorin.github.io/mesh-attendance/)
[![version](https://img.shields.io/badge/version-0.1.1-58664b)](https://github.com/baditaflorin/mesh-attendance/blob/main/package.json)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> A private, peer-to-peer check-in ledger for the people sharing a room.

Live: **https://baditaflorin.github.io/mesh-attendance/**

## What it does

Field Check-in is a deliberately small shared roll-call workspace. Open a room, share its invite, and each participant enters the name they want displayed before pressing **Check in**. The roster syncs directly across the connected browsers; exporting it produces a CSV download in the browser that requested it.

It is not an identity-verification system. “Live devices” is the number of active room connections, including people joined through the same-browser peer route, and a check-in is simply the name a participant chose to share with that room.

## Use it

1. Open the [live app](https://baditaflorin.github.io/mesh-attendance/).
2. Use **Invite** in the product bar to bring another device into the same room.
3. Each person enters a name and selects **Check in**.
4. Export the current roster when needed. The CSV is a local download; it is not uploaded by the app.

For a quick two-device check, open the app in two browser tabs, join the same room, and enter a different name in each tab.

## Local development

`mesh-common` must be a sibling directory because this app consumes it through `file:../mesh-common`.

```bash
git clone https://github.com/baditaflorin/mesh-common
git clone https://github.com/baditaflorin/mesh-attendance
cd mesh-attendance
npm ci
npm run dev
```

## Validation

```bash
npm run fmt:check
npm run typecheck
npm run test
npm run smoke
npm run screenshot
npm run demo
npm run audit:security
```

The long-running cleanup check is opt-in:

```bash
MESH_LEAK_DURATION_MS=5000 MESH_LEAK_NOISE_OPS=30 npm run test:leak
```

## Self-hosted infrastructure

| Service          | Endpoint                               | Purpose                     |
| ---------------- | -------------------------------------- | --------------------------- |
| Signaling        | `wss://turn.0docker.com/ws`            | y-webrtc signaling fan-out  |
| TURN credentials | `https://turn.0docker.com/credentials` | Ephemeral relay credentials |
| TURN relay       | `turn:turn.0docker.com:3479`           | WebRTC fallback relay       |

The Settings panel can override signaling and TURN endpoints locally. The relevant keys are `mesh-attendance:signalingUrl`, `mesh-attendance:turnTokenUrl`, `mesh-attendance:iceServers`, and `mesh-attendance:room`.

## Deployment and privacy

GitHub Pages serves the committed `docs/` directory from `main`. Validation runs on self-hosted Woodpecker CI; this repository intentionally has no GitHub Actions workflow.

See [docs/privacy.md](docs/privacy.md) for the threat model and the distinction between room-visible data and local browser data.

## License

MIT — see [LICENSE](LICENSE).
