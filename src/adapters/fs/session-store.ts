import fs from "node:fs/promises";
import path from "node:path";
import type { StoredIntakeSession } from "../../types/intake.js";

function getSessionsDir(rootDir: string): string {
  return path.join(rootDir, "specs", "sessions");
}

export async function saveStoredSession(rootDir: string, session: StoredIntakeSession): Promise<string> {
  const sessionsDir = getSessionsDir(rootDir);
  await fs.mkdir(sessionsDir, { recursive: true });

  const filePath = path.join(sessionsDir, `${session.sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf8");
  return filePath;
}

export async function loadStoredSession(rootDir: string, sessionId: string): Promise<StoredIntakeSession | null> {
  const filePath = path.join(getSessionsDir(rootDir), `${sessionId}.json`);

  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as StoredIntakeSession;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function getLatestIncompleteSession(rootDir: string): Promise<StoredIntakeSession | null> {
  const sessionsDir = getSessionsDir(rootDir);

  let entries: string[];
  try {
    entries = await fs.readdir(sessionsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const sessions = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .map(async (entry) =>
        JSON.parse(await fs.readFile(path.join(sessionsDir, entry), "utf8")) as StoredIntakeSession
      )
  );

  const incompleteSessions = sessions.filter((session) => session.status === "in_progress");
  incompleteSessions.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return incompleteSessions[0] ?? null;
}
