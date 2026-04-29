import { describe, expect, it } from "vitest";
import {
  parseSessionContent,
  groupSessionsByProject,
} from "../lib/sessionParser";

const sessionJsonl = [
  JSON.stringify({
    type: "session",
    version: 3,
    id: "session-1",
    timestamp: "2026-04-20T10:00:00.000Z",
    cwd: "/tmp/project",
  }),
  JSON.stringify({
    type: "model_change",
    provider: "openai",
    modelId: "gpt-5",
    timestamp: "2026-04-20T10:00:01.000Z",
  }),
  JSON.stringify({
    type: "thinking_level_change",
    thinkingLevel: "medium",
    timestamp: "2026-04-20T10:00:02.000Z",
  }),
  JSON.stringify({ type: "session_info", name: "Fix parser" }),
  JSON.stringify({
    type: "message",
    message: {
      role: "user",
      content: [{ type: "text", text: "Please fix the parser" }],
      timestamp: 1000,
    },
  }),
  JSON.stringify({
    type: "message",
    message: {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "hidden" },
        { type: "text", text: "Parser fixed." },
      ],
      usage: { totalTokens: 42, cost: { total: 0.12 } },
      timestamp: 2000,
    },
  }),
  "not json",
].join("\n");

describe("parseSessionContent", () => {
  it("extracts stable metadata from Pi JSONL sessions and ignores malformed lines", () => {
    const session = parseSessionContent(
      sessionJsonl,
      "/tmp/session.jsonl",
      new Date("2026-04-20T10:05:00.000Z"),
    );

    expect(session).toMatchObject({
      id: "session-1",
      filePath: "/tmp/session.jsonl",
      projectPath: "/tmp/project",
      projectName: "project",
      displayTitle: "Fix parser",
      firstUserMessage: "Please fix the parser",
      lastAssistantMessage: "Parser fixed.",
      provider: "openai",
      model: "gpt-5",
      thinkingLevel: "medium",
      turnCount: 1,
      totalTokens: 42,
      cost: 0.12,
    });
    expect(session.preview).toContain("Please fix the parser");
    expect(session.preview).toContain("Parser fixed.");
  });

  it("falls back to the first user prompt when no session name exists", () => {
    const session = parseSessionContent(
      [
        JSON.stringify({
          type: "session",
          id: "session-2",
          timestamp: "2026-04-20T10:00:00.000Z",
          cwd: "/tmp/other",
        }),
        JSON.stringify({
          type: "message",
          message: {
            role: "user",
            content: "Summarize this repo",
            timestamp: 1000,
          },
        }),
      ].join("\n"),
      "/tmp/session-2.jsonl",
      new Date("2026-04-20T10:05:00.000Z"),
    );

    expect(session.displayTitle).toBe("Summarize this repo");
    expect(session.projectName).toBe("other");
  });
});

describe("groupSessionsByProject", () => {
  it("groups sessions by project and keeps newest session first", () => {
    const older = parseSessionContent(
      sessionJsonl,
      "/tmp/older.jsonl",
      new Date("2026-04-20T10:05:00.000Z"),
    );
    const newer = parseSessionContent(
      sessionJsonl.replace("session-1", "session-3"),
      "/tmp/newer.jsonl",
      new Date("2026-04-21T10:05:00.000Z"),
    );

    const [project] = groupSessionsByProject([older, newer]);

    expect(project.projectPath).toBe("/tmp/project");
    expect(project.sessionCount).toBe(2);
    expect(project.latestSession.filePath).toBe("/tmp/newer.jsonl");
  });
});
