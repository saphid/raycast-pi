import { describe, expect, it } from "vitest";
import { buildPiArgs, buildInteractivePiCommand } from "../lib/piCli";
import { buildTerminalShellCommand } from "../lib/terminalCommand";
import { buildTransformPrompt } from "../lib/transforms";

describe("buildPiArgs", () => {
  it("builds read-only print mode args with model and thinking preferences", () => {
    expect(
      buildPiArgs({
        print: true,
        prompt: "Explain the code",
        model: "openai/gpt-5",
        thinkingLevel: "low",
        toolMode: "safe-readonly",
      }),
    ).toEqual([
      "--model",
      "openai/gpt-5",
      "--thinking",
      "low",
      "--tools",
      "read,grep,find,ls",
      "-p",
      "Explain the code",
    ]);
  });

  it("builds fast no-tools print mode args", () => {
    expect(
      buildPiArgs({ print: true, prompt: "Hello", toolMode: "fast-no-tools" }),
    ).toEqual(["--no-tools", "-p", "Hello"]);
  });

  it("builds session resume and fork args", () => {
    expect(buildPiArgs({ sessionFile: "/tmp/session.jsonl" })).toEqual([
      "--session",
      "/tmp/session.jsonl",
    ]);
    expect(buildPiArgs({ forkSessionFile: "/tmp/session.jsonl" })).toEqual([
      "--fork",
      "/tmp/session.jsonl",
    ]);
  });
});

describe("buildInteractivePiCommand", () => {
  it("shell-quotes prompt and session paths for visible terminal handoff", () => {
    expect(
      buildInteractivePiCommand({
        piBinary: "pi",
        sessionFile: "/tmp/A Project/session.jsonl",
        prompt: "Fix John's test",
      }),
    ).toBe("pi --session '/tmp/A Project/session.jsonl' 'Fix John'\\''s test'");
  });
});

describe("buildTerminalShellCommand", () => {
  it("shell-quotes cwd so terminal handoff does not evaluate command substitutions", () => {
    expect(
      buildTerminalShellCommand(
        "pi 'Prompt with $VALUE'",
        "/tmp/project `rm -rf nope`",
      ),
    ).toBe("cd '/tmp/project `rm -rf nope`' && pi 'Prompt with $VALUE'");
  });
});

describe("buildTransformPrompt", () => {
  it("wraps selected text with explicit read-only instructions", () => {
    const prompt = buildTransformPrompt(
      "find-bugs",
      "const value = null.value",
    );

    expect(prompt).toContain("Do not edit files");
    expect(prompt).toContain("Find bugs");
    expect(prompt).toContain("const value = null.value");
  });
});
