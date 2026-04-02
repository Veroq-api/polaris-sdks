#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync, chmodSync } from "fs";
import { homedir, hostname } from "os";
import { join } from "path";
import { exec } from "child_process";

const GITHUB_CLIENT_ID = "Ov23ligfgbZkJDvu8JwO";
const GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const VEROQ_API_URL = "https://api.thepolarisreport.com";
const CREDENTIALS_DIR = join(homedir(), ".veroq");
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, "credentials");
// Legacy fallback
const LEGACY_CREDENTIALS_FILE = join(homedir(), ".polaris", "credentials");

function readCredentials(): string | null {
  try {
    const key = readFileSync(CREDENTIALS_FILE, "utf-8").trim();
    return key || null;
  } catch {
    // Fall back to legacy location
    try {
      const key = readFileSync(LEGACY_CREDENTIALS_FILE, "utf-8").trim();
      return key || null;
    } catch {
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin"
    ? `open "${url}"`
    : process.platform === "win32"
      ? `start "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

async function login(): Promise<void> {
  // Step 1: Request device code
  const codeResp = await fetch(GITHUB_DEVICE_CODE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: "user:email" }),
  });

  if (!codeResp.ok) {
    console.error("Failed to initiate GitHub device flow.");
    process.exit(1);
  }

  const codeData = await codeResp.json() as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval?: number;
    expires_in?: number;
  };

  const { device_code, user_code, verification_uri } = codeData;
  let interval = (codeData.interval ?? 5) * 1000;
  const expiresIn = (codeData.expires_in ?? 900) * 1000;

  console.log();
  console.log(`  Go to: ${verification_uri}`);
  console.log(`  Enter code: ${user_code}`);
  console.log();

  openBrowser(verification_uri);

  process.stdout.write("Waiting for authorization...");

  // Step 2: Poll for access token
  const deadline = Date.now() + expiresIn;
  let ghAccessToken: string | null = null;

  while (Date.now() < deadline) {
    await sleep(interval);
    process.stdout.write(".");

    const tokenResp = await fetch(GITHUB_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const tokenData = await tokenResp.json() as {
      access_token?: string;
      error?: string;
      interval?: number;
    };

    const error = tokenData.error;
    if (error === "authorization_pending") continue;
    if (error === "slow_down") {
      interval = (tokenData.interval ?? interval / 1000 + 5) * 1000;
      continue;
    }
    if (error === "expired_token") {
      console.error("\nDevice code expired. Please try again.");
      process.exit(1);
    }
    if (error === "access_denied") {
      console.error("\nAuthorization denied.");
      process.exit(1);
    }
    if (error) {
      console.error(`\nGitHub error: ${error}`);
      process.exit(1);
    }

    if (tokenData.access_token) {
      ghAccessToken = tokenData.access_token;
      break;
    }
  }

  if (!ghAccessToken) {
    console.error("\nTimed out waiting for authorization.");
    process.exit(1);
  }

  console.log(" authorized!");

  // Step 3: Exchange GitHub token for API JWT
  const authResp = await fetch(`${VEROQ_API_URL}/api/v1/auth/github/device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: ghAccessToken }),
  });

  if (!authResp.ok) {
    const errData = await authResp.json() as { message?: string };
    console.error(`Auth error: ${errData.message || "Authentication failed"}`);
    process.exit(1);
  }

  const authData = await authResp.json() as { token: string; email?: string };
  const jwtToken = authData.token;
  const email = authData.email || "";

  // Step 4: Create an API key
  const keyResp = await fetch(`${VEROQ_API_URL}/api/v1/keys/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ name: `CLI (${hostname()})` }),
  });

  if (!keyResp.ok) {
    const errData = await keyResp.json() as { message?: string };
    console.error(`Key creation error: ${errData.message || "Failed to create API key"}`);
    process.exit(1);
  }

  const keyData = await keyResp.json() as { key: string };
  const apiKey = keyData.key;

  // Step 5: Save credentials
  mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CREDENTIALS_FILE, apiKey, { mode: 0o600 });

  console.log();
  console.log(`Authenticated as ${email} — API key saved to ~/.veroq/credentials`);
}

async function whoami(): Promise<void> {
  const apiKey = process.env.VEROQ_API_KEY || process.env.POLARIS_API_KEY || readCredentials();
  if (!apiKey) {
    console.error("Not logged in. Run `veroq login` to authenticate.");
    process.exit(1);
  }

  const resp = await fetch(`${VEROQ_API_URL}/api/v1/user/api-keys`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (resp.status === 401) {
    console.error("Invalid or expired API key. Run `veroq login` to re-authenticate.");
    process.exit(1);
  }
  if (!resp.ok) {
    console.error(`Error checking credentials (HTTP ${resp.status}).`);
    process.exit(1);
  }

  const data = await resp.json() as { keys?: unknown[] };
  console.log(`Logged in — key prefix: ${apiKey.slice(0, 12)}`);
  if (data.keys) {
    console.log(`Active keys: ${data.keys.length}`);
  }
}

function logout(): void {
  let removed = false;
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE);
    removed = true;
  }
  // Also clean up legacy credentials
  if (existsSync(LEGACY_CREDENTIALS_FILE)) {
    unlinkSync(LEGACY_CREDENTIALS_FILE);
    removed = true;
  }
  if (removed) {
    console.log("Logged out — credentials removed.");
  } else {
    console.log("No credentials found.");
  }
}

const command = process.argv[2];

switch (command) {
  case "login":
    login();
    break;
  case "whoami":
    whoami();
    break;
  case "logout":
    logout();
    break;
  default:
    console.log("Usage: veroq <command>");
    console.log();
    console.log("Commands:");
    console.log("  login   Authenticate via GitHub");
    console.log("  whoami  Show current authentication status");
    console.log("  logout  Remove stored credentials");
    process.exit(1);
}
