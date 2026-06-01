# mesh-attendance

[![pages](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh-attendance-4a90e2)](https://baditaflorin.github.io/mesh-attendance/)
[![version](https://img.shields.io/badge/version-0.1.1-blue)](https://github.com/baditaflorin/mesh-attendance/blob/main/package.json)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> Instant class/meeting roll-call via QR — CSV export, no Google Forms

Live: **https://baditaflorin.github.io/mesh-attendance/**

Source: **https://github.com/baditaflorin/mesh-attendance**

Tip the dev: **https://www.paypal.com/paypalme/florinbadita**

---

## What it is

Peer-to-peer browser app, no backend of its own beyond the self-hosted WebRTC stack listed below. Built on `@baditaflorin/mesh-common`, hosted on GitHub Pages from `docs/`.

Instant roll-call with no sign-up: open the room, share its invite QR (the 📡 button), and everyone who joins types their name and taps **check in**. The roster syncs live across every device in the room, and the organiser can export it to CSV. The QR is the _room invite_ — there's no per-person scanning; once you're in the room, you just check in.

## How to use it

**Try it in 30 seconds:** open the live URL (**https://baditaflorin.github.io/mesh-attendance/**) in two browser tabs, type a different name in each, and tap **check in**. Both rosters update live; tap **export CSV** to download the list.

In a real room: open the live URL, tap the 📡 invite button (top-right) and let everyone scan the QR to join the same room. Each person checks in with their name; you export the CSV when you're done.

## Quickstart (local)

```bash
git clone https://github.com/baditaflorin/mesh-common
git clone https://github.com/baditaflorin/mesh-attendance
cd mesh-attendance
npm install
npm run dev
```

`mesh-common` must sit as a **sibling** directory because `package.json` references it via `file:../mesh-common`.

## Self-hosted infrastructure

| Repo                                              | Endpoint                               | Purpose                     |
| ------------------------------------------------- | -------------------------------------- | --------------------------- |
| https://github.com/baditaflorin/signaling-server  | `wss://turn.0docker.com/ws`            | y-webrtc signaling fan-out  |
| https://github.com/baditaflorin/turn-token-server | `https://turn.0docker.com/credentials` | HMAC TURN creds, 1-hour TTL |
| https://github.com/baditaflorin/coturn-hetzner    | `turn:turn.0docker.com:3479`           | TURN relay                  |

## Settings overrides (localStorage keys)

The settings drawer lets the user override signaling and TURN endpoints. Keys:

- `mesh-attendance:signalingUrl`
- `mesh-attendance:turnTokenUrl`
- `mesh-attendance:iceServers`
- `mesh-attendance:room`

If endpoints are blank or unreachable, the app falls back to STUN-only.

## Build & deploy

GitHub Pages serves the committed `docs/` directory on the `main` branch. There is **no GitHub Actions build workflow**; the Husky pre-commit + pre-push hooks gate formatting / typecheck / smoke build locally.

```bash
npm run smoke   # build + sanity-check docs/
```

## Privacy

See `docs/privacy.md` for the threat model — what other peers in the mesh see, what the self-hosted infra sees, what stays local.

## License

MIT — see `LICENSE`.
