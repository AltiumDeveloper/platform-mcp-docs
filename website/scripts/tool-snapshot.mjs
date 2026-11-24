#!/usr/bin/env node
// Writes tools/snapshot.json from the production server's tools/list, normalised (lib/tools.mjs normaliseTools).
// Live: exchanges A365_REFRESH_TOKEN with A365_CLIENT_ID and A365_CLIENT_SECRET, a refresh token from a workspace's
// Admin > Developer page. `--from <file>` normalises a saved tools/list result instead.
import { writeFileSync } from 'node:fs';
import { SNAPSHOT, normaliseTools, parseReply, readJson } from './lib/tools.mjs';

const TOKEN_URL = 'https://auth.altium.com/connect/token';
const MCP_URL = 'https://mcp.altium.com';
const PROTOCOL = '2025-06-18';
const TIMEOUT_MS = 30_000;

const fail = (message, code = 1) => {
  console.error(`tool-snapshot: ${message}`);
  process.exit(code);
};

async function accessToken() {
  const { A365_CLIENT_ID: clientId, A365_CLIENT_SECRET: clientSecret, A365_REFRESH_TOKEN: refreshToken } = process.env;
  if (!clientId || !clientSecret || !refreshToken) fail('set A365_CLIENT_ID, A365_CLIENT_SECRET and A365_REFRESH_TOKEN');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) fail(`token exchange returned ${response.status} ${body.error ?? ''}`);
  // A new refresh token means the old one is spent; there is nowhere safe to keep the new one, so stop here.
  if (body.refresh_token && body.refresh_token !== refreshToken) fail('the refresh token rotated: create a new one and replace A365_REFRESH_TOKEN');
  if (!body.access_token) fail('the token exchange returned no access token');
  return body.access_token;
}

// One JSON-RPC call; a notification (no `id`) has no reply to read.
async function rpc(headers, method, params, id) {
  const body = JSON.stringify({ jsonrpc: '2.0', method, params, ...(id && { id }) });
  const response = await fetch(MCP_URL, { method: 'POST', headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) fail(`${method} returned ${response.status}`);
  if (!id) return { response };
  const reply = parseReply(await response.text(), id, response.headers.get('content-type') ?? '');
  if (reply.error) fail(`${method} failed: ${reply.error.message}`);
  return { response, result: reply.result };
}

async function listTools() {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${await accessToken()}` };
  const init = await rpc(headers, 'initialize', { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: 'platform-mcp-docs tool-snapshot', version: '1' } }, 1);
  const session = init.response.headers.get('mcp-session-id');
  if (session) headers['mcp-session-id'] = session;
  headers['mcp-protocol-version'] = init.result.protocolVersion;
  await rpc(headers, 'notifications/initialized');
  const tools = [];
  const seen = new Set();
  let cursor;
  let id = 2;
  do {
    const { result } = await rpc(headers, 'tools/list', cursor ? { cursor } : {}, id++);
    tools.push(...result.tools);
    cursor = result.nextCursor;
    if (cursor && seen.has(cursor)) fail(`tools/list repeated the cursor ${cursor}`);
    seen.add(cursor);
  } while (cursor);
  return tools;
}

const at = process.argv.indexOf('--from');
if (at > 0 && !process.argv[at + 1]) fail('usage: tool-snapshot.mjs [--from <tools/list result>]', 2);
const read = (file) => {
  try {
    return readJson(file);
  } catch (error) {
    return fail(`cannot read ${file}: ${error.message}`, 2);
  }
};
// A saved file may be the tools/list result, the whole JSON-RPC reply, or a snapshot.
const saved = at > 0 ? read(process.argv[at + 1]) : null;
const tools = saved ? (Array.isArray(saved) ? saved : saved.result?.tools ?? saved.tools) : await listTools();
if (!tools?.length) fail('the server listed no tools');
writeFileSync(SNAPSHOT, `${JSON.stringify(normaliseTools(tools), null, 2)}\n`);
console.log(`tool-snapshot: ${tools.length} tools`);
