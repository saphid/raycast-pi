import { shellQuote } from "./piCli";

export function buildTerminalShellCommand(
  command: string,
  cwd: string,
): string {
  return `cd ${shellQuote(cwd)} && ${command}`;
}
