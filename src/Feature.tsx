import { useEffect, useMemo, useState } from "react";
import type { MeshConfig, YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

type Entry = { id: string; name: string; ts: number };

const NAME_KEY = (prefix: string) => `${prefix}:displayName`;

export function Feature({ room, config }: Props) {
  const [name, setName] = useState(
    () => localStorage.getItem(NAME_KEY(config.storagePrefix)) ?? "",
  );
  const [, rerender] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (name) localStorage.setItem(NAME_KEY(config.storagePrefix), name);
  }, [name, config.storagePrefix]);

  useEffect(() => {
    if (!room) return;
    const entries = room.doc.getMap<Entry>("entries");
    const onChange = () => rerender((n) => n + 1);
    entries.observe(onChange);
    return () => entries.unobserve(onChange);
  }, [room]);

  const entries = useMemo(() => {
    if (!room) return [] as Entry[];
    const m = room.doc.getMap<Entry>("entries");
    const arr: Entry[] = [];
    m.forEach((v) => arr.push(v));
    arr.sort((a, b) => a.ts - b.ts);
    return arr;
  }, [room]);

  if (!room) {
    return (
      <div className="att-screen">
        <h1>attendance</h1>
        <p className="att-status">Connecting…</p>
      </div>
    );
  }

  const myEntry = room.doc.getMap<Entry>("entries").get(room.peerId);

  const checkIn = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    room.doc.getMap<Entry>("entries").set(room.peerId, {
      id: room.peerId,
      name: trimmed,
      ts: Date.now(),
    });
    setSubmitted(true);
  };

  const remove = () => {
    room.doc.getMap<Entry>("entries").delete(room.peerId);
    setSubmitted(false);
  };

  const exportCsv = () => {
    const header = "timestamp_iso,name,peer_id\n";
    const rows = entries
      .map((e) => `"${new Date(e.ts).toISOString()}","${e.name.replace(/"/g, '""')}","${e.id}"`)
      .join("\n");
    const blob = new Blob([header + rows + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="att-screen">
      <header className="att-header">
        <h1>attendance</h1>
        <p className="att-status">
          {entries.length} checked in · {room.peerCount + 1} present in room
        </p>
      </header>

      {!myEntry || !submitted ? (
        <form
          className="att-form"
          onSubmit={(e) => {
            e.preventDefault();
            checkIn();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            autoFocus
            maxLength={48}
          />
          <button type="submit" disabled={!name.trim()}>
            ✓ check in
          </button>
        </form>
      ) : (
        <div className="att-confirmed">
          <p>
            ✓ checked in as <strong>{myEntry.name}</strong> at{" "}
            {new Date(myEntry.ts).toLocaleTimeString()}
          </p>
          <button type="button" className="att-undo" onClick={remove}>
            undo
          </button>
        </div>
      )}

      <ul className="att-list">
        {entries.map((e) => (
          <li key={e.id} className={`att-entry ${e.id === room.peerId ? "is-me" : ""}`}>
            <span className="att-name">{e.name}</span>
            <span className="att-time">{new Date(e.ts).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="att-export"
        onClick={exportCsv}
        disabled={entries.length === 0}
      >
        export CSV ({entries.length} entries)
      </button>
    </div>
  );
}
