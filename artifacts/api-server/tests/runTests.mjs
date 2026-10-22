// ORO AI automated test runner (MASTER_BRIEF.md Part 15, Tests 1-10).
//
// What it does:
//   1. Builds a private copy of the API server into .test-build/ (the running app is not touched).
//   2. Starts that server on a free port with its own empty SQLite database in a temp folder,
//      so the tests never change the demo data you rehearse with.
//   3. Runs tests/required.test.mjs against it over HTTP (real backend logic + real SQLite database).
//   4. Stops the server, deletes the temp database and exits with code 0 (all pass) or 1 (any fail).
//
// Run from the project root:  npm test      (or: pnpm test)
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = ".test-build";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "oro-ai-tests-"));
const dbPath = path.join(tempDir, "oro-test.db");

function run(command, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: serverDir, stdio: "inherit", env: { ...process.env, ...env } });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function waitForHealth(url, server, logLines) {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) break;
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  console.error(logLines.join(""));
  throw new Error(`Test server did not start (${url}).`);
}

let server;
let exitCode = 1;
try {
  console.log("\n[1/3] Building a test copy of the API server...");
  if ((await run("node", ["build.mjs"], { BUILD_OUT_DIR: buildDir })) !== 0) throw new Error("Build failed.");

  const port = await freePort();
  console.log(`[2/3] Starting the test server on port ${port} with a fresh SQLite database (${dbPath})...`);
  const logLines = [];
  server = spawn("node", [path.join(buildDir, "index.mjs")], {
    cwd: serverDir,
    // Speech-to-text keys are blanked so voice tests always use the labelled simulated transcription.
    env: {
      ...process.env, PORT: String(port), ORO_DB_PATH: dbPath, NODE_ENV: "test", LOG_LEVEL: "warn",
      OPENAI_API_KEY: "", AI_INTEGRATIONS_OPENAI_BASE_URL: "", AI_INTEGRATIONS_OPENAI_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => logLines.push(d.toString()));
  server.stderr.on("data", (d) => logLines.push(d.toString()));
  const base = `http://127.0.0.1:${port}/api`;
  await waitForHealth(`${base}/healthz`, server, logLines);

  console.log("[3/3] Running the 10 required tests...\n");
  exitCode = await run("node", ["--test", "--test-reporter=spec", "--test-concurrency=1", "tests/required.test.mjs"], {
    ORO_API_URL: base,
    ORO_DB_PATH: dbPath,
  });
  if (exitCode !== 0) {
    console.error("\nSome tests FAILED. Last server log lines:\n" + logLines.slice(-20).join(""));
  }
} catch (error) {
  console.error(`\nTest run aborted: ${error.message}`);
  exitCode = 1;
} finally {
  if (server && server.exitCode === null) server.kill("SIGTERM");
  fs.rmSync(tempDir, { recursive: true, force: true });
}
console.log(exitCode === 0 ? "\nRESULT: ALL TESTS PASSED" : "\nRESULT: TESTS FAILED");
process.exit(exitCode);
