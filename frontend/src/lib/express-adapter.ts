import type { NextRequest } from "next/server";
import { Readable } from "node:stream";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

type ExpressApp = (req: IncomingMessage, res: ServerResponse) => void;

let expressApp: ExpressApp | null = null;

function getExpressApp(): ExpressApp {
  if (!expressApp) {
    const require = createRequire(import.meta.url);
    const candidates = [
      path.join(process.cwd(), "server-dist", "handler.cjs"),
      path.join(process.cwd(), "frontend", "server-dist", "handler.cjs"),
    ];

    const handlerPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!handlerPath) {
      throw new Error(`API bundle not found (cwd=${process.cwd()})`);
    }

    const mod = require(handlerPath);
    expressApp = (mod.default ?? mod) as ExpressApp;
  }
  return expressApp;
}

export async function runExpress(
  request: NextRequest,
  pathSegments: string[]
): Promise<Response> {
  const app = getExpressApp();
  const url = `/api/${pathSegments.join("/")}${request.nextUrl.search}`;

  const bodyBuffer =
    request.method !== "GET" && request.method !== "HEAD"
      ? Buffer.from(await request.arrayBuffer())
      : null;

  return new Promise<Response>((resolve, reject) => {
    try {
      const socket = new Socket();
      const nodeReq = new IncomingMessage(socket);
      nodeReq.method = request.method;
      nodeReq.url = url;
      nodeReq.headers = Object.fromEntries(request.headers.entries());

      if (bodyBuffer && bodyBuffer.length > 0) {
        const readable = Readable.from(bodyBuffer);
        readable.on("data", (chunk) => nodeReq.push(chunk));
        readable.on("end", () => nodeReq.push(null));
      } else {
        nodeReq.push(null);
      }

      const nodeRes = new ServerResponse(nodeReq);
      const chunks: Buffer[] = [];
      let statusCode = 200;

      nodeRes.writeHead = (code: number, headers?: unknown) => {
        statusCode = code;
        if (headers && typeof headers === "object") {
          for (const [key, value] of Object.entries(headers)) {
            if (value !== undefined) nodeRes.setHeader(key, value as string | string[]);
          }
        }
        return nodeRes;
      };

      nodeRes.write = (chunk: unknown) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        return true;
      };

      nodeRes.end = (chunk?: unknown) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));

        const headers = new Headers();
        for (const [key, value] of Object.entries(nodeRes.getHeaders())) {
          if (value === undefined) continue;
          headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
        }

        resolve(
          new Response(Buffer.concat(chunks).length ? Buffer.concat(chunks) : null, {
            status: statusCode,
            headers,
          })
        );
        return nodeRes;
      };

      app(nodeReq, nodeRes);
    } catch (error) {
      reject(error);
    }
  });
}
