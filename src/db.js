const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const hasPostgres = Boolean(process.env.DATABASE_URL);
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const SCHEMA_VERSION = 3;
const DEFAULT = { schemaVersion: SCHEMA_VERSION, guilds: {}, users: {}, memories: [] };
let pool = null;
let memoryData = loadJson();

function loadJson() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) { fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT, null, 2)); return structuredClone(DEFAULT); }
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return migrateData(data);
  } catch { return structuredClone(DEFAULT); }
}
function migrateData(data) {
  data ||= structuredClone(DEFAULT); data.guilds ||= {}; data.users ||= {}; data.memories ||= [];
  data.schemaVersion = SCHEMA_VERSION;
  for (const guild of Object.values(data.guilds)) { guild.settings ||= {}; guild.milestones ||= []; if (guild.onboardingSent == null) guild.onboardingSent = false; }
  for (const user of Object.values(data.users)) normalizeUser(user);
  return data;
}
function saveJson() { fs.mkdirSync(DATA_DIR, { recursive: true }); const tmp = `${DATA_FILE}.tmp`; fs.writeFileSync(tmp, JSON.stringify(memoryData, null, 2)); fs.renameSync(tmp, DATA_FILE); }
function defaultSettings() {
  return { xpEnabled: true, levelUpChannelId: null, cooldownMs: null, xpMin: null, xpMax: null, dailyEnabled: true, embedColor: "#63c5da", language: "vi", autoEmoji: true };
}
function defaultGuild(guildId, config) {
  return { id: guildId, schemaVersion: SCHEMA_VERSION, companion: { name: config.companion.defaultName, level: 1, xp: 0, stageId: "spark", createdAt: Date.now() }, totalXp: 0, totalInteractions: 0, milestones: [], settings: defaultSettings(), onboardingSent: false, createdAt: Date.now() };
}
function defaultUser(guildId, userId) { return { guildId, userId, xp: 0, level: 1, badges: [], daily: { lastClaim: 0, streak: 0 }, quest: { date: "", progress: {}, claimed: {} }, lastMessageXp: 0, xpAntiSpam: { recentHashes: [], recentMessages: [], lastRewardAt: 0 } }; }
function normalizeUser(user) { user.badges ||= []; user.daily ||= { lastClaim: 0, streak: 0 }; user.quest ||= { date: "", progress: {}, claimed: {} }; user.quest.progress ||= {}; user.quest.claimed ||= {}; user.xpAntiSpam ||= { recentHashes: [], recentMessages: [], lastRewardAt: 0 }; return user; }
function normalizeGuild(guild, config) { guild.schemaVersion ||= SCHEMA_VERSION; guild.companion ||= { name: config.companion.defaultName, level: 1, xp: 0, stageId: "spark", createdAt: Date.now() }; guild.totalXp ||= 0; guild.totalInteractions ||= 0; guild.milestones ||= []; guild.settings = { ...defaultSettings(), ...(guild.settings || {}) }; if (guild.onboardingSent == null) guild.onboardingSent = false; return guild; }

async function init() {
  if (!hasPostgres) return;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, max: 5 });
  await pool.query(`CREATE TABLE IF NOT EXISTS guilds (id TEXT PRIMARY KEY, data JSONB NOT NULL); CREATE TABLE IF NOT EXISTS users (key TEXT PRIMARY KEY, data JSONB NOT NULL); CREATE TABLE IF NOT EXISTS memories (id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, data JSONB NOT NULL);`);
}
async function getGuild(guildId, config) { if (!pool) { if (!memoryData.guilds[guildId]) { memoryData.guilds[guildId] = defaultGuild(guildId, config); saveJson(); } return normalizeGuild(memoryData.guilds[guildId], config); } const r = await pool.query("SELECT data FROM guilds WHERE id=$1", [guildId]); if (r.rowCount) return normalizeGuild(r.rows[0].data, config); const guild = defaultGuild(guildId, config); await pool.query("INSERT INTO guilds(id,data) VALUES($1,$2)", [guildId, guild]); return guild; }
async function saveGuild(guild) { if (!pool) { memoryData.guilds[guild.id] = guild; saveJson(); return; } await pool.query("INSERT INTO guilds(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data", [guild.id, guild]); }
async function getUser(guildId, userId) { const key = `${guildId}:${userId}`; if (!pool) { if (!memoryData.users[key]) { memoryData.users[key] = defaultUser(guildId, userId); saveJson(); } return normalizeUser(memoryData.users[key]); } const r = await pool.query("SELECT data FROM users WHERE key=$1", [key]); if (r.rowCount) return normalizeUser(r.rows[0].data); const user = defaultUser(guildId, userId); await pool.query("INSERT INTO users(key,data) VALUES($1,$2)", [key, user]); return user; }
async function saveUser(user) { const key = `${user.guildId}:${user.userId}`; if (!pool) { memoryData.users[key] = user; saveJson(); return; } await pool.query("INSERT INTO users(key,data) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data", [key, user]); }
async function getLeaderboard(guildId, metric = "xp", limit = 10) { const allowed = new Set(["xp", "streak", "badges"]); if (!allowed.has(metric)) throw new Error("Invalid leaderboard metric"); const sort = (a,b) => metric === "streak" ? b.daily.streak-a.daily.streak : metric === "badges" ? b.badges.length-a.badges.length : ((b.level*100000)+b.xp)-((a.level*100000)+a.xp); if (!pool) return Object.values(memoryData.users).filter(u => u.guildId === guildId).map(normalizeUser).sort(sort).slice(0, limit); const r = await pool.query("SELECT data FROM users WHERE data->>'guildId'=$1", [guildId]); return r.rows.map(x => normalizeUser(x.data)).sort(sort).slice(0, limit); }
async function addMemory(guildId, memory) { if (!pool) { memoryData.memories.unshift({ guildId, ...memory }); memoryData.memories = memoryData.memories.slice(0, 500); saveJson(); return; } await pool.query("INSERT INTO memories(guild_id,data) VALUES($1,$2)", [guildId, memory]); await pool.query(`DELETE FROM memories WHERE guild_id=$1 AND id NOT IN (SELECT id FROM memories WHERE guild_id=$1 ORDER BY id DESC LIMIT 50)`, [guildId]); }
async function getMemories(guildId, limit = 10) { if (!pool) return memoryData.memories.filter(x => x.guildId === guildId).slice(0, limit); const r = await pool.query("SELECT data FROM memories WHERE guild_id=$1 ORDER BY id DESC LIMIT $2", [guildId, limit]); return r.rows.map(x => x.data); }
async function listGuildUsers(guildId) { if (!pool) return Object.values(memoryData.users).filter(u => u.guildId === guildId).map(normalizeUser); const r = await pool.query("SELECT data FROM users WHERE data->>'guildId'=$1", [guildId]); return r.rows.map(x => normalizeUser(x.data)); }
async function resetUser(guildId, userId) { const key = `${guildId}:${userId}`; if (!pool) { memoryData.users[key] = defaultUser(guildId, userId); saveJson(); return; } await pool.query("DELETE FROM users WHERE key=$1", [key]); }
async function resetGuild(guildId, config) { if (!pool) { delete memoryData.guilds[guildId]; for (const key of Object.keys(memoryData.users)) if (key.startsWith(`${guildId}:`)) delete memoryData.users[key]; memoryData.memories = memoryData.memories.filter(m => m.guildId !== guildId); saveJson(); return; } await pool.query("DELETE FROM users WHERE data->>'guildId'=$1", [guildId]); await pool.query("DELETE FROM memories WHERE guild_id=$1", [guildId]); await pool.query("DELETE FROM guilds WHERE id=$1", [guildId]); await getGuild(guildId, config); }
async function exportGuild(guildId, config) { const guild = await getGuild(guildId, config); const users = await listGuildUsers(guildId); const memories = await getMemories(guildId, 100); return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), guild, users, memories }; }
async function backup(label = "manual") { const payload = hasPostgres ? { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), guilds: {}, users: {}, memories: [] } : memoryData; if (hasPostgres) { const guildRows = await pool.query("SELECT id,data FROM guilds"); const userRows = await pool.query("SELECT key,data FROM users"); const memoryRows = await pool.query("SELECT guild_id,data FROM memories ORDER BY id DESC"); for (const r of guildRows.rows) payload.guilds[r.id] = r.data; for (const r of userRows.rows) payload.users[r.key] = r.data; payload.memories = memoryRows.rows.map(r => ({ guildId: r.guild_id, ...r.data })); }
  fs.mkdirSync(BACKUP_DIR, { recursive: true }); const file = path.join(BACKUP_DIR, `nexo-${label}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`); fs.writeFileSync(file, JSON.stringify(payload, null, 2)); return file;
}
async function close() { if (pool) await pool.end(); }
module.exports = { init, getGuild, saveGuild, getUser, saveUser, getLeaderboard, addMemory, getMemories, listGuildUsers, resetUser, resetGuild, exportGuild, backup, close, hasPostgres, SCHEMA_VERSION, defaultSettings };
