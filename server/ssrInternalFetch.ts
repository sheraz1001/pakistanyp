/**
 * In-process transport for SSR data requests.
 *
 * The SSR prepass (client/src/entry-server.tsx) runs page queries such as
 * fetch('/api/businesses/slug/x'). It used to resolve those against
 * http://127.0.0.1:$PORT. On hosts that front Node with LiteSpeed/Passenger
 * (Hostinger) the app does not listen on a plain TCP port, so every SSR data
 * request failed and data pages were server-rendered as empty loading shells
 * (header + footer, no H1, default <title>).
 *
 * This module feeds those requests straight into the Express app over an
 * in-memory socket pair: real HTTP parsing and the full middleware stack,
 * no network. entry-server picks it up from globalThis.__pakistanypSsrDispatch.
 */
import http from "node:http";
import { Duplex } from "node:stream";
import type { Express } from "express";
import { country } from "@shared/country";

/** Two connected in-memory duplex streams that look enough like sockets for node:http. */
function socketPair(): [Duplex, Duplex] {
  let a: Duplex;
  let b: Duplex;
  const make = (peer: () => Duplex) =>
    new Duplex({
      read() {},
      write(chunk, _enc, cb) {
        peer().push(chunk);
        cb();
      },
      final(cb) {
        peer().push(null);
        cb();
      },
      destroy(err, cb) {
        try {
          peer().push(null);
        } catch {}
        cb(err);
      },
    });
  a = make(() => b);
  b = make(() => a);
  for (const s of [a, b] as any[]) {
    s.remoteAddress = "127.0.0.1";
    s.remotePort = 0;
    s.localAddress = "127.0.0.1";
    s.localPort = 0;
    s.encrypted = false;
    s.setTimeout = () => s;
    s.setNoDelay = () => s;
    s.setKeepAlive = () => s;
    s.ref = () => s;
    s.unref = () => s;
    s.address = () => ({ address: "127.0.0.1", family: "IPv4", port: 0 });
  }
  return [a, b];
}

export function installSsrInternalFetch(app: Express) {
  const server = http.createServer(app);

  const dispatch = (path: string, init: { method?: string; headers?: Record<string, string>; body?: any } = {}) =>
    new Promise<Response>((resolve, reject) => {
      const [clientSide, serverSide] = socketPair();
      server.emit("connection", serverSide);
      const req = http.request(
        {
          method: init.method || "GET",
          path,
          headers: { host: country.domain, "x-forwarded-proto": "https", connection: "close", ...(init.headers || {}) },
          createConnection: () => clientSide as any,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.from(c)));
          res.on("end", () => {
            const headers = new Headers();
            for (const [k, v] of Object.entries(res.headers)) {
              if (v === undefined) continue;
              headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
            }
            const status = res.statusCode || 500;
            const body = status === 204 || status === 304 ? null : Buffer.concat(chunks);
            resolve(new Response(body, { status, headers }));
            clientSide.destroy();
          });
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      if (init.body) req.write(init.body);
      req.end();
    });

  (globalThis as any).__pakistanypSsrDispatch = dispatch;
}
