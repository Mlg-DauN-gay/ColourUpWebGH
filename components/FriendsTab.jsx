"use client";
import { useState } from "react";
import { Check, Plus, User } from "lucide-react";
import { C, PALETTE } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Row } from "./atoms";

export default function FriendsTab({ friends, setFriends, mkLog, gameLive, addSeatNamed }) {
  const { L } = useL();
  const [handle, setHandle] = useState("");
  const [added, setAdded] = useState(null);
  function add() {
    const h = handle.trim().replace(/^@?/, "@");
    if (h.length < 2) return;
    const name = h.slice(1).replace(/^\w/, c => c.toUpperCase());
    const f = { id: "f" + Date.now(), name, handle: h, color: PALETTE[friends.length % PALETTE.length], together: 0 };
    setFriends(fs => [f, ...fs]); setHandle(""); setAdded(name); mkLog(L.friendAdded(name)); setTimeout(() => setAdded(null), 1600);
  }
  return (
    <div className="space-y-6">
      <div><div className="disp" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.friendsTitle}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.friendsSub}</p></div>

      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.addFriend} · {L.addByHandle}</Eyebrow>
        <div className="flex gap-2 mt-3">
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder={L.handlePh} onKeyDown={e => e.key === "Enter" && add()} className="flex-1 bg-transparent outline-none mono" style={{ fontSize: 16, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
          <Btn small onClick={add} disabled={handle.trim().length < 2}>{L.add}</Btn>
        </div>
        {added && <div className="mono mt-2 flex items-center gap-1" style={{ fontSize: 11, color: C.win }}><Check size={12} /> {L.friendAdded(added)}</div>}
      </div>

      <div className="space-y-2">
        {friends.length === 0 && <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noFriends}</div>}
        {friends.map(f => (
          <Row key={f.id}>
            <Dot p={f} size={34} />
            <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div><div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{f.handle} · {L.togetherN(f.together)}</div></div>
            {gameLive
              ? <button onClick={() => addSeatNamed(f.name, f.color)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ background: C.brassSoft, border: `1px solid ${C.brass}`, fontSize: 11, fontWeight: 600, color: C.brass }}><Plus size={12} /> {L.inviteToNext}</button>
              : <span className="grid place-items-center rounded-full" style={{ width: 30, height: 30, background: C.raise, color: C.mute }}><User size={14} /></span>}
          </Row>
        ))}
      </div>
    </div>
  );
}
