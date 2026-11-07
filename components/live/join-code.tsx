"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, RefreshCw, Smartphone } from "lucide-react";
import { connectActivity, phaseLabel, useClock } from "./use-activity";
import type { PublicRound } from "@/lib/live";

type Network = { selected: string | null; options: { name: string; url: string }[]; qr: string | null };

export function JoinCode({ monitor = false }: { monitor?: boolean }) {
  const [network, setNetwork] = useState<Network>();
  const [chosen, setChosen] = useState("");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState(false);
  const [round, setRound] = useState<PublicRound | null>(null);
  const clock = useClock(round);

  useEffect(() => {
    const controller = new AbortController();
    const query = chosen ? `?url=${encodeURIComponent(chosen)}` : "";
    fetch(`/api/network${query}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Network unavailable"); return response.json(); })
      .then(info => { setNetwork(info); setError(false); })
      .catch(error => { if (error.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [chosen, revision]);

  useEffect(() => {
    if (!monitor) return;
    const socket = connectActivity();
    socket.on("round", setRound);
    socket.on("disconnect", () => setRound(null));
    socket.connect();
    return () => { socket.disconnect(); };
  }, [monitor]);

  return <section className="join-board" aria-label="Phone join details">
    <div className="join-board-head">
      <div><Smartphone size={17} /><span>Join on your phone</span></div>
      <button type="button" className="icon-button" aria-label="Refresh network addresses" title="Refresh network addresses" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /></button>
    </div>
    <div className="join-code-body">
      {network?.qr && !error ? <Image className="join-qr" src={network.qr} alt="Scan this QR code to join the CampusNav challenge" width={288} height={288} unoptimized /> :
        <div className="join-code-empty"><Smartphone size={34} /><span>{error ? "Start the local CampusNav server and refresh." : network ? "Enable the hotspot and refresh." : "Finding the laptop’s network address…"}</span></div>}
      <div className="join-instructions">
        <strong>Connect to the classroom hotspot.</strong>
        <p>Scan the code or open this address in your browser.</p>
        {network?.selected && !error && <a className="join-address" href={network.selected} target="_blank" rel="noreferrer">{network.selected}<ArrowUpRight size={15} /></a>}
        {network && network.options.length > 1 && !error && <label className="network-options">Network interface
          <select value={network.selected ?? ""} onChange={event => setChosen(event.target.value)}>
            {network.options.map(option => <option key={option.url} value={option.url}>{option.name} · {new URL(option.url).hostname}</option>)}
          </select>
        </label>}
      </div>
    </div>
    {monitor && <div className="join-board-foot"><span className="status-dot" />{round ? `Game ${round.game.id} · ${round.game.start} → ${round.game.target} · ${phaseLabel[round.phase]}` : "Connecting"}<span className="join-count">{round?.online ?? 0} online</span><strong>{clock}</strong></div>}
  </section>;
}
