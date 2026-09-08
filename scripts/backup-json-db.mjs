import { copyFile, access } from "node:fs/promises";
const file = process.env.JSON_DB_PATH || "/data/attendance.json";
await access(file);
const backup = `${file}.manual-${new Date().toISOString().replaceAll(":", "-")}.bak`;
await copyFile(file, backup);
console.log(`Backup created: ${backup}`);
