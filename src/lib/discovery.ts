import { LocalStorage } from "@raycast/api";
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
export type MaxIndexedSessions = "100" | "500" | "all";

export type PiResource = {
  type: ResourceType;
  scope: "global" | "project";
  title: string;
  filePath: string;
  directory: string;
};

type FileCandidate = {
  filePath: string;
  mtimeMs: number;
  mtime: Date;
};

type CachedSession = Omit<PiSession, "createdAt" | "lastModified"> & {
  createdAt?: string;
  lastModified: string;
};

type SessionCache = {
  version: 1;
  sessions: Record<string, { mtimeMs: number; session: CachedSession }>;
};

const SESSION_CACHE_KEY = "pi-session-summary-cache-v1";

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

function sessionToCache(session: PiSession): CachedSession {
  return {
    ...session,
    createdAt: session.createdAt?.toISOString(),
    lastModified: session.lastModified.toISOString(),
  };
}

function sessionFromCache(session: CachedSession): PiSession {
  return {
    ...session,
    createdAt: session.createdAt ? new Date(session.createdAt) : undefined,
    lastModified: new Date(session.lastModified),
  };
}

async function readSessionCache(): Promise<SessionCache> {
  const raw = await LocalStorage.getItem<string>(SESSION_CACHE_KEY);
  if (!raw) return { version: 1, sessions: {} };
  try {
    const parsed = JSON.parse(raw) as SessionCache;
    if (parsed.version === 1 && parsed.sessions) return parsed;
  } catch {
    // Ignore corrupt cache and rebuild incrementally.
  }
  return { version: 1, sessions: {} };
}

async function writeSessionCache(cache: SessionCache): Promise<void> {
  await LocalStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
}

function maxSessionCount(maxIndexedSessions?: MaxIndexedSessions): number {
  if (maxIndexedSessions === "100") return 100;
  if (maxIndexedSessions === "all") return 3000;
  return 500;
}

async function findSessionFiles(
  agentDir: string,
  maxIndexedSessions?: MaxIndexedSessions,
): Promise<FileCandidate[]> {
  const sessionsDir = path.join(getDefaultAgentDir(agentDir), "sessions");
  const files = await walk(
    sessionsDir,
    (filePath) => filePath.endsWith(".jsonl"),
    3000,
  );
  const candidates: FileCandidate[] = [];
  for (const filePath of files) {
    const stat = await fs.stat(filePath);
    candidates.push({ filePath, mtimeMs: stat.mtimeMs, mtime: stat.mtime });
  }

  return candidates
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, maxSessionCount(maxIndexedSessions));
}

async function readSessionSummaryContent(filePath: string): Promise<string> {
  const stat = await fs.stat(filePath);
  const maxChunkBytes = 128 * 1024;

  if (stat.size <= maxChunkBytes * 2) return fs.readFile(filePath, "utf8");

  const handle = await fs.open(filePath, "r");
  try {
    const head = Buffer.alloc(maxChunkBytes);
    const tail = Buffer.alloc(maxChunkBytes);
    const headRead = await handle.read(head, 0, maxChunkBytes, 0);
    const tailRead = await handle.read(
      tail,
      0,
      maxChunkBytes,
      Math.max(0, stat.size - maxChunkBytes),
    );
    const headText = head.subarray(0, headRead.bytesRead).toString("utf8");
    const rawTailText = tail.subarray(0, tailRead.bytesRead).toString("utf8");
    const firstNewline = rawTailText.indexOf("\n");
    const tailText =
      firstNewline >= 0 ? rawTailText.slice(firstNewline + 1) : rawTailText;
    return `${headText}\n${tailText}`;
  } finally {
    await handle.close();
  }
}

export async function listPiSessions(
  agentDir?: string,
  maxIndexedSessions?: MaxIndexedSessions,
): Promise<PiSession[]> {
  const files = await findSessionFiles(
    getDefaultAgentDir(agentDir),
    maxIndexedSessions,
  );
  const cache = await readSessionCache();
  let cacheChanged = false;

  const sessions: PiSession[] = [];
  for (const candidate of files) {
    const cached = cache.sessions[candidate.filePath];
    if (cached && cached.mtimeMs === candidate.mtimeMs) {
      sessions.push(sessionFromCache(cached.session));
      continue;
    }

    const content = await readSessionSummaryContent(candidate.filePath);
    const session = parseSessionContent(
      content,
      candidate.filePath,
      candidate.mtime,
    );
    cache.sessions[candidate.filePath] = {
      mtimeMs: candidate.mtimeMs,
      session: sessionToCache(session),
    };
    cacheChanged = true;
    sessions.push(session);
  }

  const activeFiles = new Set(files.map((file) => file.filePath));
  for (const filePath of Object.keys(cache.sessions)) {
    if (!activeFiles.has(filePath)) {
      delete cache.sessions[filePath];
      cacheChanged = true;
    }
  }

  if (cacheChanged) await writeSessionCache(cache);
  return sessions.sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
  );
}

export async function listPiProjects(
  agentDir?: string,
  maxIndexedSessions?: MaxIndexedSessions,
): Promise<PiProject[]> {
  return groupSessionsByProject(
    await listPiSessions(agentDir, maxIndexedSessions),
  );
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
