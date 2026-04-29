import path from "path";

export type PiSession = {
  id: string;
  filePath: string;
  projectPath: string;
  projectName: string;
  displayTitle: string;
  firstUserMessage: string;
  lastAssistantMessage: string;
  preview: string;
  provider?: string;
  model?: string;
  thinkingLevel?: string;
  turnCount: number;
  totalTokens?: number;
  cost?: number;
  createdAt?: Date;
  lastModified: Date;
};

export type PiProject = {
  projectPath: string;
  projectName: string;
  latestSession: PiSession;
  sessionCount: number;
  sessions: PiSession[];
  model?: string;
  provider?: string;
};

type JsonObject = Record<string, unknown>;

type ContentBlock = {
  type?: string;
  text?: string;
  thinking?: string;
};

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((block: unknown) => {
      const object = asObject(block) as ContentBlock | undefined;
      if (!object) return "";
      if (object.type === "text" && typeof object.text === "string")
        return object.text;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function truncate(value: string, max = 140): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function projectNameFromPath(projectPath: string): string {
  const parsed = path.basename(projectPath.replace(/\/$/, ""));
  return parsed || projectPath || "Unknown Project";
}

function parseCost(usage: JsonObject | undefined): number | undefined {
  const cost = asObject(usage?.cost);
  if (!cost) return undefined;
  const candidates = [
    cost.total,
    cost.totalUsd,
    cost.usd,
    cost.input && cost.output
      ? Number(cost.input) + Number(cost.output)
      : undefined,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate))
      return candidate;
  }
  return undefined;
}

export function parseSessionContent(
  content: string,
  filePath: string,
  lastModified: Date,
): PiSession {
  let id = path.basename(filePath, ".jsonl");
  let projectPath = path.dirname(filePath);
  let createdAt: Date | undefined;
  let provider: string | undefined;
  let model: string | undefined;
  let thinkingLevel: string | undefined;
  let sessionName: string | undefined;
  let firstUserMessage = "";
  let lastAssistantMessage = "";
  let turnCount = 0;
  let totalTokens: number | undefined;
  let cost: number | undefined;
  const previewParts: string[] = [];

  for (const line of content.split("\n")) {
    if (!line.trim()) continue;

    let entry: JsonObject;
    try {
      entry = JSON.parse(line) as JsonObject;
    } catch {
      continue;
    }

    switch (entry.type) {
      case "session": {
        if (typeof entry.id === "string") id = entry.id;
        if (typeof entry.cwd === "string") projectPath = entry.cwd;
        if (typeof entry.timestamp === "string")
          createdAt = new Date(entry.timestamp);
        break;
      }
      case "model_change": {
        if (typeof entry.provider === "string") provider = entry.provider;
        if (typeof entry.modelId === "string") model = entry.modelId;
        break;
      }
      case "thinking_level_change": {
        if (typeof entry.thinkingLevel === "string")
          thinkingLevel = entry.thinkingLevel;
        break;
      }
      case "session_info": {
        if (typeof entry.name === "string") sessionName = entry.name;
        break;
      }
      case "message": {
        const message = asObject(entry.message);
        if (!message) break;
        const role = message.role;
        const text = textFromContent(message.content);
        if (!text) break;

        if (role === "user") {
          turnCount += 1;
          if (!firstUserMessage) firstUserMessage = text;
          if (previewParts.length < 6)
            previewParts.push(`**User:** ${truncate(text, 280)}`);
        } else if (role === "assistant") {
          lastAssistantMessage = text;
          if (previewParts.length < 6)
            previewParts.push(`**Pi:** ${truncate(text, 280)}`);
          const usage = asObject(message.usage);
          const usageTokens = usage?.totalTokens;
          if (typeof usageTokens === "number") totalTokens = usageTokens;
          const usageCost = parseCost(usage);
          if (usageCost !== undefined) cost = usageCost;
        }
        break;
      }
    }
  }

  const displayTitle = truncate(
    sessionName || firstUserMessage || `Pi Session ${id}`,
    100,
  );
  const preview =
    previewParts.length > 0
      ? previewParts.join("\n\n")
      : "No user-visible messages found.";

  return {
    id,
    filePath,
    projectPath,
    projectName: projectNameFromPath(projectPath),
    displayTitle,
    firstUserMessage,
    lastAssistantMessage,
    preview,
    provider,
    model,
    thinkingLevel,
    turnCount,
    totalTokens,
    cost,
    createdAt,
    lastModified,
  };
}

export function groupSessionsByProject(sessions: PiSession[]): PiProject[] {
  const groups = new Map<string, PiSession[]>();

  for (const session of sessions) {
    const group = groups.get(session.projectPath) ?? [];
    group.push(session);
    groups.set(session.projectPath, group);
  }

  return Array.from(groups.entries())
    .map(([projectPath, projectSessions]) => {
      const sortedSessions = [...projectSessions].sort(
        (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
      );
      const latestSession = sortedSessions[0];
      return {
        projectPath,
        projectName: latestSession.projectName,
        latestSession,
        sessionCount: sortedSessions.length,
        sessions: sortedSessions,
        model: latestSession.model,
        provider: latestSession.provider,
      };
    })
    .sort(
      (a, b) =>
        b.latestSession.lastModified.getTime() -
        a.latestSession.lastModified.getTime(),
    );
}
