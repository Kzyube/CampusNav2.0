# CampusNav 2.0

**Connecting Places. Finding Better Paths.**

A 38-minute Chapter 7 presentation on campus wayfinding, graph algorithms, and infrastructure planning. The deck runs a real classroom route challenge over the presenter laptop’s local network.

## Start the presentation

Install Node.js 22 or newer. Run these commands from the project folder while you have internet access for installation.

```bash
npm ci
npm run build
npm start
```

Open [the deck](http://localhost:3000/). The production server serves the deck and Socket.IO on port 3000. Run `npm run dev` for a development server with live code updates. Use `PORT` to select another port.

When rebuilding, stop the production server with **Ctrl+C** before running `npm run build`, then run `npm start`. The running server indexes its build files at startup, so replacing them in place can cause missing styles and scripts.

| Key | Action |
| --- | --- |
| Left / right arrows | Previous / next slide |
| Page Up / Page Down | Previous / next slide |
| Space | Next slide |
| Home / End | First / last slide |
| O | Overview with all 28 slides |
| N | Speaker notes |
| F | Fullscreen |
| Escape | Close a panel or leave fullscreen |

Use `/?slide=12` to open a particular slide. On slides 5, 8, and 21, scroll over the curved title wheel or choose a numbered step to update the map. Select **English** or **Tagalog** in Notes for the slide overview, on-screen cues, and spoken script. The language choice follows the notes window in the same browser. For private speaker notes, set the projector to extended-display mode. Open **Notes → Open separate window** and keep it on the laptop. The notes follow the deck in another window on the same browser and origin.

## Run the classroom activity

1. Build the app in advance. Turn on the presenter laptop’s Wi-Fi hotspot and have classmates connect to it. Keep phones on that network if they report there is no internet.
2. Run `npm start` on the laptop. It listens on `0.0.0.0:3000`. The terminal prints the IPv4 join URL for each active interface. Look for the hotspot interface. Linux users can also run `ip -4 -brief addr`. On Windows use `ipconfig` and find the hotspot adapter’s IPv4 address. On macOS use `ifconfig` or check the sharing interface in network settings.
3. Open slide 17. Select the hotspot interface when several are listed, or set the intended address explicitly with `LAN_IP=<hotspot-ip> npm start` on Linux or macOS. In PowerShell, run `$env:LAN_IP = "<hotspot-ip>"; npm start`. Slide 17 and Presenter Controls generate the QR code from the chosen address. Use the refresh button if the hotspot address changed.
4. If a phone cannot reach the page, check that its Wi-Fi network is the laptop hotspot and that the laptop firewall allows inbound TCP traffic on the selected port from that hotspot. On a laptop using UFW, an interface-scoped rule is `sudo ufw allow in on <hotspot-interface> to any port 3000 proto tcp`. On Windows, allow Node.js on the hotspot’s network profile or add an inbound TCP rule scoped to that network. On macOS, allow incoming connections for Node.js in Firewall Options if prompted. Campus Wi-Fi may block traffic between devices.
5. Students scan the code or type the displayed `http://<hotspot-ip>:3000/join` address, enter a nickname, and build a route. The default is Administration (A) to Student Center (F). The active game sets the same endpoints for everyone.
6. Open [Presenter Controls](http://localhost:3000/admin). **Start round** opens the two-minute timer. **Pause** closes submissions until **Resume**. **Reveal answer** closes submissions, publishes the correct route, and saves the ranked results for that game. **Reset round** clears the current attempt and keeps participants joined. Select **Game 1**, **Game 2**, or **Game 3** to view results, then use **Load game** or **Play again** to queue a new attempt. The games are A–F, C–E, and B–F. Start the round after loading. The lowest valid distance wins, with earlier submission breaking distance ties. A game with no valid submissions has no winner. **Remove** revokes the participant’s current entry and preserves completed results. Each game retains its latest completed result until the server restarts.
7. On slide 19, use **Final step** to show the route after discussing the distance updates. Reveal in Presenter Controls to send the result to phones.

By default, the dashboard opens directly from the laptop’s loopback address. To use the dashboard from a LAN address, enter the presenter code printed in the terminal. Set `PRESENTER_KEY` before starting to use your own code and require it on loopback as well.

## Architecture

- Next.js App Router, React, TypeScript, Tailwind CSS and Framer Motion power the responsive deck, controls and notes.
- Three.js with React Three Fiber and Drei renders the original campus model. It uses procedural geometry, one canvas and on-demand rendering. Phones and reduced-motion users start with the 2D graph. A WebGL failure falls back to the same graph.
- All slides, views and server validation share [the campus graph](./lib/graph.ts). Algorithm functions produce the state for each playback step.
- One custom Node HTTP process serves both Next.js and same-origin Socket.IO. Fonts, QR generation and 3D geometry are local. Installed dependencies and the production build are sufficient to run without internet.
- The server keeps one round in memory. Restarting clears the round and roster. Participant identity and the submission receipt survive refresh or reconnect in the same browser while the server is running. The session allows 200 participants and one valid submission per person per round.

## Presenter assignments

| Slides | Presenter | Role | Time |
| --- | --- | --- | --- |
| 1–4 | Kzyube Napoles | CEO / Main Presenter | 4 min |
| 5–7 | Hance Subaldo | Product Manager | 5 min |
| 8–10 | Lowell Ronamo | Algorithm Engineer | 4 min |
| 11–13 | Hilary Cañas | Systems Engineer | 4 min |
| 14–16 | Princess Man Oyao | Network Analyst | 4 min |
| 17–20 | Gary Dapilaga | Demo Specialist | 7 min |
| 21–23 | Ram Alferez | Data Analyst | 4 min |
| 24–28 | Jinson Oplimo | Technical Director | 6 min |

Each presenter’s final slide is a class check-in. Select a group first, then a student; repeat the selection for the second question if desired. Only Groups 1, 3, 4, and 5 are included. The suggested timing allows one minute per check-in, but discussion may take longer.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:live
```

The graph tests compare Dijkstra with exhaustive simple paths and Kruskal with all eligible five-edge combinations. The live integration test starts an isolated production server, uses the detected LAN IPv4 address when available, and drives the real Socket.IO protocol with multiple clients.

## Verification limits

The production deck and phone flow were checked in Chromium, including two phone-sized clients using the laptop’s LAN IPv4 address. A physical phone on the laptop hotspot still needs a rehearsal.

Desktop 3D uses an on-demand render loop with one WebGL context. The desktop cover exceeded the Taste performance checker’s JavaScript size budget with the 3D renderer loaded. Phones and reduced-motion users start with the lighter 2D view. The Taste layout checker did not complete on this deck, so all 20 slides were also checked in Chromium at 1440, 1024, 820, 768, and 390 pixels wide.
