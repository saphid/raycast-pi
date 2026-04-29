import type { Dirent } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { getDefaultAgentDir } from "./piCli";
import {
  groupSessionsByProject,
  parseSessionContent,
  type PiProject,
  type PiSession,
} from "./sessionParser";

export type ResourceType = "prompt" | "skill";

export type PiResource = {
  type: ResourceType;
  scope: "global" | "project";
  title: string;
  filePath: string;
  directory: string;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(
  dir: string,
  predicate: (filePath: string) => boolean,
  limit = 1000,
): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const result: string[] = [];
  const pending = [dir];

  while (pending.length > 0 && result.length < limit) {
    const current = pending.pop()!;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", ".git", "dist", "coverage"].includes(entry.name))
          pending.push(entryPath);
      } else if (predicate(entryPath)) {
        result.push(entryPath);
        if (result.length >= limit) break;
      }
    }
  }

  return result;
}

export async function listPiSessions(agentDir?: string): Promise<PiSession[]> {
  const sessionsDir = path.join(getDefaultAgentDir(agentDir), "sessions");
  const files = await walk(
    sessionsDir,
    (filePath) => filePath.endsWith(".jsonl"),
    3000,
  );
  const sessions = await Promise.all(
    files.map(async (filePath) => {
      const [content, stat] = await Promise.all([
        fs.readFile(filePath, "utf8"),
        fs.stat(filePath),
      ]);
      return parseSessionContent(content, filePath, stat.mtime);
    }),
  );

  return sessions.sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
  );
}

export async function listPiProjects(agentDir?: string): Promise<PiProject[]> {
  return groupSessionsByProject(await listPiSessions(agentDir));
}

export async function discoverResources(options: {
  agentDir?: string;
  projectPath?: string;
}): Promise<PiResource[]> {
  const agentDir = getDefaultAgentDir(options.agentDir);
  const candidates: Array<{
    type: ResourceType;
    scope: "global" | "project";
    directory: string;
  }> = [
    {
      type: "prompt",
      scope: "global",
      directory: path.join(agentDir, "prompts"),
    },
    {
      type: "skill",
      scope: "global",
      directory: path.join(agentDir, "skills"),
    },
  ];

  if (options.projectPath) {
    candidates.push(
      {
        type: "prompt",
        scope: "project",
        directory: path.join(options.projectPath, ".pi", "prompts"),
      },
      {
        type: "skill",
        scope: "project",
        directory: path.join(options.projectPath, ".pi", "skills"),
      },
      {
        type: "skill",
        scope: "project",
        directory: path.join(options.projectPath, ".agents", "skills"),
      },
    );
  }

  const resources: PiResource[] = [];
  for (const candidate of candidates) {
    const files = await walk(
      candidate.directory,
      (filePath) =>
        filePath.endsWith(".md") ||
        filePath.endsWith(".txt") ||
        filePath.endsWith(".yaml") ||
        filePath.endsWith(".yml"),
      500,
    );
    for (const filePath of files) {
      resources.push({
        type: candidate.type,
        scope: candidate.scope,
        title: path.basename(filePath).replace(/\.(md|txt|ya?ml)$/i, ""),
        filePath,
        directory: candidate.directory,
      });
    }
  }

  return resources.sort((a, b) =>
    `${a.type}-${a.scope}-${a.title}`.localeCompare(
      `${b.type}-${b.scope}-${b.title}`,
    ),
  );
}

export function defaultProjectPath(preferred?: string): string {
  return preferred?.trim() || process.cwd() || os.homedir();
}
