import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export type ThinkingLevel =
  | ""
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export type AskExecutionMode = "fast-no-tools" | "safe-readonly";

export type PiPreferences = {
  piBinaryPath?: string;
  defaultModel?: string;
  thinkingLevel?: ThinkingLevel;
  askExecutionMode?: AskExecutionMode;
};

export type PiArgOptions = {
  print?: boolean;
  toolMode?: AskExecutionMode;
  prompt?: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  sessionFile?: string;
  forkSessionFile?: string;
};

export function expandTilde(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

export function getDefaultAgentDir(agentDir?: string): string {
  return expandTilde(
    agentDir?.trim() || path.join(os.homedir(), ".pi", "agent"),
  );
}

export function resolvePiBinary(preferences: PiPreferences = {}): string {
  const preferred = preferences.piBinaryPath?.trim();
  if (preferred) return expandTilde(preferred);

  const candidates = [
    "/opt/homebrew/bin/pi",
    "/usr/local/bin/pi",
    path.join(os.homedir(), ".bun", "bin", "pi"),
    path.join(os.homedir(), ".npm-global", "bin", "pi"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return "pi";
}

export function buildPiArgs(options: PiArgOptions): string[] {
  const args: string[] = [];

  if (options.model) args.push("--model", options.model);
  if (options.thinkingLevel) args.push("--thinking", options.thinkingLevel);
  if (options.sessionFile) args.push("--session", options.sessionFile);
  if (options.forkSessionFile) args.push("--fork", options.forkSessionFile);
  if (options.toolMode === "fast-no-tools") args.push("--no-tools");
  if (options.toolMode === "safe-readonly")
    args.push("--tools", "read,grep,find,ls");
  if (options.print) args.push("-p");
  if (options.prompt) args.push(options.prompt);

  return args;
}

export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildInteractivePiCommand(
  options: PiArgOptions & { piBinary: string },
): string {
  return [options.piBinary, ...buildPiArgs(options)].map(shellQuote).join(" ");
}

export async function runPiPrint(
  prompt: string,
  options: {
    cwd: string;
    preferences?: PiPreferences;
    onData?: (chunk: string) => void;
  },
): Promise<string> {
  const piBinary = resolvePiBinary(options.preferences);
  const args = buildPiArgs({
    print: true,
    toolMode: options.preferences?.askExecutionMode ?? "safe-readonly",
    prompt,
    model: options.preferences?.defaultModel,
    thinkingLevel: options.preferences?.thinkingLevel,
  });

  return new Promise((resolve, reject) => {
    const child = spawn(piBinary, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        HOME: os.homedir(),
        PATH: `${process.env.PATH ?? ""}:/opt/homebrew/bin:/usr/local/bin`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      options.onData?.(chunk);
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `pi exited with code ${code}`));
    });
  });
}
