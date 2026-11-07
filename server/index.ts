import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { isIPv4 } from "node:net";
import { networkInterfaces } from "node:os";
import next from "next";
import QRCode from "qrcode";
import { Server } from "socket.io";
import { registerActivity, type ActivityServer } from "./activity";

const dev = process.argv.includes("--dev");
const port = Number(process.env.PORT ?? 3000);
const configuredIp = process.env.LAN_IP;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer from 1 to 65535.");
if (configuredIp && !isIPv4(configuredIp)) throw new Error("LAN_IP must be an IPv4 address.");

const customKey = process.env.PRESENTER_KEY?.trim();
const presenterKey = customKey || randomBytes(6).toString("hex");
const hostname = "0.0.0.0";
const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();

function addresses() {
  const result = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
    (entries ?? []).filter(entry => entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254."))
      .map(entry => ({ name, address: entry.address })));
  const priority = (address: string) => address === "10.42.0.1" || address === "192.168.137.1" ? 0 : 1;
  return result.sort((a, b) => priority(a.address) - priority(b.address));
}

function networkInfo() {
  const interfaces = addresses();
  const options = [
    ...(configuredIp ? [{ name: "Configured LAN_IP", address: configuredIp }] : []),
    ...interfaces.filter(entry => entry.address !== configuredIp),
  ].map(({ name, address }) => ({ name, url: `http://${address}:${port}/join` }));
  return { options, selected: options[0]?.url ?? null };
}

const qrCodes = new Map<string, Promise<string>>();
const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url?.split("?")[0] === "/api/network") {
      const network = networkInfo();
      const address = new URL(req.url, "http://localhost").searchParams.get("url");
      const url = address && network.options.some(option => option.url === address) ? address : network.selected;
      if (url && !qrCodes.has(url)) {
        qrCodes.set(url, QRCode.toDataURL(url, { width: 288, margin: 4, errorCorrectionLevel: "M" }));
      }
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ ...network, selected: url, qr: url ? await qrCodes.get(url) : null }));
      return;
    }
    await handle(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    if (!res.writableEnded) res.end("CampusNav could not serve this request.");
  }
});

const io: ActivityServer = new Server(server, {
  serveClient: false,
  maxHttpBufferSize: 16_384,
  allowRequest(req, done) {
    const origin = req.headers.origin;
    const allowed = !origin || origin === `http://${req.headers.host}`;
    done(null, allowed);
  },
});

const clearTimer = registerActivity(io, presenterKey, !customKey);
server.listen(port, hostname, () => {
  console.log(`\nCampusNav presenter   http://localhost:${port}/`);
  console.log(`Presenter controls   http://localhost:${port}/admin`);
  for (const option of networkInfo().options) console.log(`Phone join (${option.name})   ${option.url}`);
  if (!networkInfo().selected) console.log("No LAN address found. Enable the hotspot, then refresh slide 12.");
  console.log(customKey ? "Presenter code       Set by PRESENTER_KEY" : `Presenter code       ${presenterKey}`);
  console.log("");
});

function close() {
  clearTimer();
  void io.close().finally(() => process.exit());
}

process.once("SIGINT", close);
process.once("SIGTERM", close);
