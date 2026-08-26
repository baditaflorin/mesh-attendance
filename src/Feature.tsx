import { useMemo, useState } from "react";
import {
  MeshButton,
  MeshEmpty,
  MeshNameInput,
  MeshStatusPill,
  MeshSurface,
  MeshToasts,
  pushToast,
  useNamedPeer,
  usePerPeerValue,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

type Entry = { id: string; name: string; ts: number };

function csvCell(value: string): string {
  const oneLine = value.replace(/[\r\n]+/g, " ");
  const safeValue = /^[=+\-@]/.test(oneLine) ? `'${oneLine}` : oneLine;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function Feature({ room, config }: Props) {
  if (!room) {
    return (
      <main className="att-screen att-connecting" aria-labelledby="attendance-title">
        <div className="att-connecting-orb" aria-hidden="true" />
        <p className="att-kicker">Shared room ledger</p>
        <h1 id="attendance-title">Field Check-in</h1>
        <p className="att-connecting-copy">Joining your check-in room…</p>
      </main>
    );
  }
  return <Body room={room} config={config} />;
}

function Body({ room, config }: { room: YRoom; config: MeshConfig }) {
  const [editingCheckIn, setEditingCheckIn] = useState(false);
  const { name, setName, nameOf } = useNamedPeer(config, room);
  const peerEntries = usePerPeerValue<Entry>(room, "entries", {
    id: "",
    name: "",
    ts: 0,
  });

  const entries = useMemo(() => {
    const values = peerEntries.entries.map(([, entry]) => entry);
    values.sort((a, b) => a.ts - b.ts);
    return values;
  }, [peerEntries.entries]);

  const myEntry = peerEntries.valueOf(room.peerId);
  const hasMyEntry = Boolean(myEntry);
  const showCheckInForm = !hasMyEntry || editingCheckIn;
  const liveDevices = room.peerCount + 1;

  const checkIn = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    peerEntries.setMy({
      id: room.peerId,
      name: trimmed,
      ts: Date.now(),
    });
    setEditingCheckIn(false);
    pushToast(room, "checked in", { peerId: room.peerId });
  };

  const remove = () => {
    peerEntries.clearMy();
    setEditingCheckIn(false);
    pushToast(room, "removed their check-in", {
      kind: "is-warning",
      peerId: room.peerId,
    });
  };

  const exportCsv = () => {
    const header = "timestamp_iso,name,peer_id\n";
    const rows = entries
      .map((entry) =>
        [new Date(entry.ts).toISOString(), entry.name, entry.id].map(csvCell).join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <main className="att-screen" aria-labelledby="attendance-title">
      <header className="att-header">
        <div className="att-heading-group">
          <p className="att-kicker">Shared room ledger</p>
          <h1 id="attendance-title">Field Check-in</h1>
          <p className="att-lede">A simple roll call for the devices sharing this room.</p>
        </div>
        <div className="att-summary" aria-label="Current room summary">
          <MeshStatusPill tone="live" dot announce="polite">
            {entries.length} checked in
          </MeshStatusPill>
          <span className="att-device-count" title="Live connection count, not an identity check">
            {liveDevices} {liveDevices === 1 ? "device" : "devices"} live
          </span>
        </div>
      </header>

      <section className="att-workbench" aria-label="Check-in workspace">
        <MeshSurface as="section" tone="accent" padding="lg" className="att-action-panel">
          <div className="att-panel-heading">
            <span className="att-panel-index" aria-hidden="true">
              01
            </span>
            <div>
              <p className="att-panel-label">Your entry</p>
              <h2>Check yourself in</h2>
            </div>
          </div>

          {showCheckInForm ? (
            <form
              className="att-form"
              onSubmit={(event) => {
                event.preventDefault();
                checkIn();
              }}
            >
              <MeshNameInput
                label="Your name"
                value={name}
                onChange={setName}
                placeholder="Name for this room"
                maxLength={48}
                showCounter
                hint="This name is visible to people in this room."
              />
              <div className="att-form-actions">
                <MeshButton type="submit" size="lg" fullWidth disabled={!name.trim()}>
                  Check in
                </MeshButton>
                {hasMyEntry ? (
                  <MeshButton
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={() => setEditingCheckIn(false)}
                  >
                    Keep current entry
                  </MeshButton>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="att-confirmed" role="status">
              <div className="att-confirmed-mark" aria-hidden="true">
                ✓
              </div>
              <div>
                <p className="att-confirmed-title">You’re checked in</p>
                <p className="att-confirmed-copy">
                  {myEntry!.name} · {formatTime(myEntry!.ts)}
                </p>
              </div>
              <div className="att-confirmed-actions">
                <MeshButton
                  type="button"
                  variant="quiet"
                  size="sm"
                  onClick={() => setEditingCheckIn(true)}
                >
                  Edit
                </MeshButton>
                <MeshButton type="button" variant="quiet" size="sm" onClick={remove}>
                  Remove
                </MeshButton>
              </div>
            </div>
          )}

          <p className="att-truth-note">
            Live device count reflects active connections. A check-in is a shared name, not a
            verified identity.
          </p>
        </MeshSurface>

        <MeshSurface as="section" tone="raised" padding="none" className="att-roster-panel">
          <div className="att-roster-header">
            <div>
              <p className="att-panel-label">Room roster</p>
              <h2>
                {entries.length === 0 ? "Waiting for the first entry" : "Present in this room"}
              </h2>
            </div>
            <MeshButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={exportCsv}
              disabled={entries.length === 0}
            >
              Export roster CSV
            </MeshButton>
          </div>

          <div className="att-roster-list" aria-live="polite">
            {entries.length === 0 ? (
              <MeshEmpty
                size="sm"
                title="No check-ins yet"
                message="Share the room invite, then names will appear here as people check in."
              />
            ) : (
              <ul className="att-list" aria-label="Checked-in people">
                {entries.map((entry) => {
                  const isMe = entry.id === room.peerId;
                  const resolvedName = nameOf(entry.id);
                  return (
                    <li key={entry.id} className={`att-entry ${isMe ? "is-me" : ""}`}>
                      <span className="att-avatar" aria-hidden="true">
                        {initials(entry.name)}
                      </span>
                      <span className="att-entry-body">
                        <span className="att-name">
                          {entry.name}
                          {isMe ? <span className="att-you">You</span> : null}
                        </span>
                        <span className="att-peer-id">
                          {resolvedName ? "Shared name" : "Device"} · {entry.id.slice(0, 6)}
                        </span>
                      </span>
                      <time className="att-time" dateTime={new Date(entry.ts).toISOString()}>
                        {formatTime(entry.ts)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="att-export-note">CSV export is a local browser download.</p>
        </MeshSurface>
      </section>

      <MeshToasts room={room} resolveName={nameOf} position="bottom" maxVisible={2} />
    </main>
  );
}
