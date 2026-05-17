import { useEffect, useMemo, useState } from "react";
import { usePerPeerValue, type MeshConfig, type YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

type Entry = { id: string; name: string; ts: number };

const NAME_KEY = (prefix: string) => `${prefix}:displayName`;

export function Feature({ room, config }: Props) {
  if (!room) {
    return (
      <div className="att-screen">
        <h1>attendance</h1>
        <p className="att-status">Connecting…</p>
      </div>
    );
  }
  return <Body room={room} config={config} />;
}

function Body({ room, config }: { room: YRoom; config: MeshConfig }) {
  const [name, setName] = useState(
    () => localStorage.getItem(NAME_KEY(config.storagePrefix)) ?? "",
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (name) localStorage.setItem(NAME_KEY(config.storagePrefix), name);
  }, [name, config.storagePrefix]);

  const peerEntries = usePerPeerValue<Entry>(room, "entries", {
    id: "",
    name: "",
    ts: 0,
  });

  const entries = useMemo(() => {
    const arr = peerEntries.entries.map(([, v]) => v);
    arr.sort((a, b) => a.ts - b.ts);
    return arr;
  }, [peerEntries.entries]);

  const myEntry = peerEntries.valueOf(room.peerId);

  const checkIn = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    peerEntries.setMy({
      id: room.peerId,
      name: trimmed,
      ts: Date.now(),
    });
    setSubmitted(true);
  };

  const remove = () => {
    peerEntries.clearMy();
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

  const hasMyEntry = !!myEntry;

  return (
    <div className="att-screen">
      <header className="att-header">
        <h1>attendance</h1>
        <p className="att-status">
          {entries.length} checked in · {room.peerCount + 1} present in room
        </p>
      </header>

      {!hasMyEntry || !submitted ? (
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
            ✓ checked in as <strong>{myEntry!.name}</strong> at{" "}
            {new Date(myEntry!.ts).toLocaleTimeString()}
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
