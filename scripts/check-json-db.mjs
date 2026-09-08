import { access, readFile } from "node:fs/promises";
const file = process.env.JSON_DB_PATH || "/data/attendance.json";
await access(file);
const data = JSON.parse(await readFile(file, "utf8"));
for (const key of ["employees", "attendance", "locations", "users", "reports"]) if (!Array.isArray(data[key])) throw new Error(`Invalid JSON database: ${key}`);
console.log(JSON.stringify({ ok: true, file, employees: data.employees.length, attendance: data.attendance.length, locations: data.locations.length }));
