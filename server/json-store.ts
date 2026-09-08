import { mkdir, readFile, rename, copyFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type JsonEmployee = { id: number; name: string; branch: string; latitude: number | null; longitude: number | null; radiusMeters: number | null; phone: string | null; telegramChatId: string | null; telegramPendingAction: "check_in" | "check_out" | null; telegramLinkCodeHash: string | null; telegramLinkCodeExpiresAt: string | null; scheduleJson: string | null; defaultStartTime: string | null; defaultEndTime: string | null; lastLateAlertDate: string | null; lastAbsenceAlertDate: string | null; active: number; createdAt: string; updatedAt: string };
export type JsonAttendance = { id: number; employeeId: number; action: "check_in" | "check_out"; recordedAt: string; latitude: number | null; longitude: number | null; accuracyMeters: number | null; locationName: string | null; note: string | null };
export type JsonLocation = { id: number; name: string; latitude: number; longitude: number; radiusMeters: number; active: number };
export type JsonUser = { id: number; openId: string; name: string | null; email: string | null; branch: string | null; latitude: number | null; longitude: number | null; radiusMeters: number | null; loginMethod: string | null; role: "user" | "admin"; createdAt: string; updatedAt: string; lastSignedIn: string };
export type JsonSettings = { id: 1; graceMinutes: number; summaryTime: string; attendanceStartDate: string | null; summaryCronTaskUid: string | null; lastSummaryDate: string | null; createdAt: string; updatedAt: string };
export type JsonReport = { id: number; dateKey: string; content: string; telegramSentAt: string | null; createdAt: string; updatedAt: string };
export type JsonCredentials = { id: 1; username: string; passwordHash: string; updatedAt: string };
export type JsonState = { employees: JsonEmployee[]; attendance: JsonAttendance[]; locations: JsonLocation[]; users: JsonUser[]; settings: JsonSettings | null; reports: JsonReport[]; credentials: JsonCredentials | null; nextIds: { employee: number; attendance: number; location: number; user: number; report: number } };

const filePath = process.env.JSON_DB_PATH || "/data/attendance.json";
const backupPath = `${filePath}.bak`;
let state: JsonState | null = null;
let chain = Promise.resolve();
const now = () => new Date().toISOString();
const emptyState = (): JsonState => ({ employees: [], attendance: [], locations: [], users: [], settings: null, reports: [], credentials: null, nextIds: { employee: 1, attendance: 1, location: 1, user: 1, report: 1 } });

async function loadState() {
  if (state) return state;
  await mkdir(dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    const seedPath = join(process.cwd(), "data", "attendance.seed.json");
    if (existsSync(seedPath)) { try { state = JSON.parse(await readFile(seedPath, "utf8")) as JsonState; await writeFile(filePath, JSON.stringify(state, null, 2)); return state; } catch { /* fall through to an empty store */ } }
    state = emptyState(); await writeFile(filePath, JSON.stringify(state, null, 2)); return state;
  }
  try { state = JSON.parse(await readFile(filePath, "utf8")) as JsonState; } catch { state = emptyState(); }
  return state;
}
export async function readJsonState() { return loadState(); }
export async function mutateJsonState<T>(fn: (value: JsonState) => T | Promise<T>) {
  let result!: T;
  chain = chain.then(async () => { const current = await loadState(); result = await fn(current); const temp = `${filePath}.tmp`; await writeFile(temp, JSON.stringify(current, null, 2)); if (existsSync(filePath)) await copyFile(filePath, backupPath); await rename(temp, filePath); });
  await chain;
  return result;
}
export function timestamp() { return now(); }
export function allocate(state: JsonState, type: keyof JsonState["nextIds"]) { const id = state.nextIds[type]; state.nextIds[type] += 1; return id; }
export { filePath as jsonDatabasePath };
