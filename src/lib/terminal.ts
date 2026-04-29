import { open, showToast, Toast } from "@raycast/api";
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import {
  buildInteractivePiCommand,
  resolvePiBinary,
  type PiArgOptions,
  type PiPreferences,
} from "./piCli";
import { buildTerminalShellCommand } from "./terminalCommand";

const execFileAsync = promisify(execFile);

export type TerminalApp =
  | "default"
  | "terminal"
  | "iterm"
  | "ghostty"
  | "warp"
  | "kitty"
  | "alacritty";

function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function yamlBlock(value: string, indentation = "              "): string {
  return value
    .split("\n")
    .map((line) => `${indentation}${line}`)
    .join("\n");
}

export async function openTerminalWithCommand(
  command: string,
  cwd: string,
  terminalApp: TerminalApp = "default",
): Promise<void> {
  const shellCommand = buildTerminalShellCommand(command, cwd);

  try {
    switch (terminalApp) {
      case "iterm":
        await openInITerm(shellCommand);
        break;
      case "ghostty":
        await execFileAsync("open", [
          "-a",
          "Ghostty",
          "--args",
          "-e",
          "sh",
          "-lc",
          shellCommand,
        ]);
        break;
      case "warp":
        await openInWarp(shellCommand, cwd);
        break;
      case "kitty":
        await execFileAsync("kitty", [
          "--single-instance",
          `--directory=${cwd}`,
          "-e",
          "sh",
          "-lc",
          shellCommand,
        ]);
        break;
      case "alacritty":
        await execFileAsync("alacritty", [
          "--working-directory",
          cwd,
          "-e",
          "sh",
          "-lc",
          shellCommand,
        ]);
        break;
      case "terminal":
      case "default":
      default:
        await openInTerminal(shellCommand);
        break;
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open terminal",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function openInTerminal(shellCommand: string): Promise<void> {
  const script = `
    tell application "Terminal"
      activate
      do script "${escapeAppleScript(shellCommand)}"
    end tell
  `;
  await execFileAsync("osascript", ["-e", script]);
}

async function openInITerm(shellCommand: string): Promise<void> {
  const script = `
    tell application "iTerm"
      activate
      create window with default profile
      tell current session of current window
        write text "${escapeAppleScript(shellCommand)}"
      end tell
    end tell
  `;
  await execFileAsync("osascript", ["-e", script]);
}

async function openInWarp(shellCommand: string, cwd: string): Promise<void> {
  const id = `raycast-pi-${Date.now()}`;
  const dir = path.join(os.homedir(), ".warp", "launch_configurations");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.yaml`);
  fs.writeFileSync(
    file,
    `---\nname: ${id}\nwindows:\n  - tabs:\n      - layout:\n          cwd: ${JSON.stringify(cwd)}\n          commands:\n            - exec: |-\n${yamlBlock(shellCommand)}\n`,
    "utf8",
  );
  await open(`warp://launch/${id}`);
  setTimeout(() => {
    try {
      fs.unlinkSync(file);
    } catch {
      // ignore cleanup failures
    }
  }, 30_000);
}

export async function launchPiInTerminal(
  options: PiArgOptions & {
    cwd: string;
    terminalApp?: TerminalApp;
    preferences?: PiPreferences;
  },
): Promise<void> {
  const piBinary = resolvePiBinary(options.preferences);
  const command = buildInteractivePiCommand({ ...options, piBinary });
  await openTerminalWithCommand(command, options.cwd, options.terminalApp);
}
