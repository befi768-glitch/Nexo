const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const https = require("node:https");
const crypto = require("node:crypto");

const hasPostgres = Boolean(process.env.DATABASE_URL);
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");
const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.join(DATA_DIR, "backups");
const SCHEMA_VERSION = 5;
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
function defaultUser(guildId, userId) { return { guildId, userId, xp: 0, level: 1, coins: 0, inventory: [], equipped: { frame: null, title: null, emoji: null }, daily: { lastClaim: 0, streak: 0 }, quest: { date: "", progress: {}, claimed: {} }, lastMessageXp: 0, xpAntiSpam: { recentHashes: [], recentMessages: [], lastRewardAt: 0 } }; }
function normalizeUser(user) { user.coins = Number.isFinite(user.coins) ? user.coins : 0; user.inventory ||= []; user.equipped ||= { frame: null, title: null, emoji: null }; user.equipped = { frame: null, title: null, emoji: null, ...user.equipped }; user.badges ||= []; user.daily ||= { lastClaim: 0, streak: 0 }; user.quest ||= { date: "", progress: {}, claimed: {} }; user.quest.progress ||= {}; user.quest.claimed ||= {}; user.xpAntiSpam ||= { recentHashes: [], recentMessages: [], lastRewardAt: 0 }; return user; }
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
function hmac(key, data) { return crypto.createHmac("sha256", key).update(data).digest(); }
function sha256(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
async function uploadS3(filePath, objectKey) {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "auto";
  const accessKey = process.env.S3_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKey || !secretKey) return null;
  const body = fs.readFileSync(filePath);
  const url = new URL(endpoint);
  const prefix = process.env.S3_PREFIX ? process.env.S3_PREFIX.replace(/^\/+|\/+$/g, "") + "/" : "";
  const key = `${prefix}${objectKey}`.replace(/\/+/g, "/");
  const host = url.host;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const pathName = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(bucket)}/${encodedKey}`.replace(/\/+/g, "/");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate, "content-type": "application/json" };
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${String(headers[k]).trim()}\n`).join("");
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalRequest = `PUT\n${pathName}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: url.hostname, port: url.port || 443, method: "PUT", path: pathName, headers }, res => {
      let response = ""; res.on("data", c => response += c); res.on("end", () => { if (res.statusCode >= 200 && res.statusCode < 300) resolve(`${url.origin}/${bucket}/${key}`); else reject(new Error(`S3 upload failed (${res.statusCode}): ${response.slice(0, 300)}`)); });
    });
    req.on("error", reject); req.end(body);
  });
}

async function backup(label = "manual") { const payload = hasPostgres ? { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), guilds: {}, users: {}, memories: [] } : memoryData; if (hasPostgres) { const guildRows = await pool.query("SELECT id,data FROM guilds"); const userRows = await pool.query("SELECT key,data FROM users"); const memoryRows = await pool.query("SELECT guild_id,data FROM memories ORDER BY id DESC"); for (const r of guildRows.rows) payload.guilds[r.id] = r.data; for (const r of userRows.rows) payload.users[r.key] = r.data; payload.memories = memoryRows.rows.map(r => ({ guildId: r.guild_id, ...r.data })); }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const filename = `nexo-${label}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const file = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  if (process.env.S3_ENDPOINT && process.env.S3_BUCKET) {
    try { const remote = await uploadS3(file, filename); return { local: file, remote }; }
    catch (error) { console.error(`[BACKUP] Remote upload failed: ${error.message}`); return { local: file, remote: null, remoteError: error.message }; }
  }
  return { local: file, remote: null };
}
async function addCoins(guildId, userId, amount) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Coin amount must be a positive integer.");
  const key = `${guildId}:${userId}`;
  await getUser(guildId, userId);
  if (!pool) { const u = normalizeUser(memoryData.users[key]); u.coins = Math.max(0, (u.coins || 0) + amount); memoryData.users[key] = u; saveJson(); return u.coins; }
  const r = await pool.query(`UPDATE users SET data = jsonb_set(data, '{coins}', to_jsonb(COALESCE((data->>'coins')::bigint,0) + $2), true) WHERE key=$1 RETURNING (data->>'coins')::bigint AS coins`, [key, amount]);
  return Number(r.rows[0]?.coins ?? 0);
}
async function spendCoins(guildId, userId, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return false;
  const key = `${guildId}:${userId}`;
  await getUser(guildId, userId);
  if (!pool) { const u = normalizeUser(memoryData.users[key]); if ((u.coins || 0) < amount) return false; u.coins -= amount; memoryData.users[key] = u; saveJson(); return true; }
  const r = await pool.query(`UPDATE users SET data = jsonb_set(data, '{coins}', to_jsonb((data->>'coins')::bigint - $2), true) WHERE key=$1 AND COALESCE((data->>'coins')::bigint,0) >= $2 RETURNING 1`, [key, amount]);
  return r.rowCount === 1;
}
async function close() { if (pool) await pool.end(); }
module.exports = { init, getGuild, saveGuild, getUser, saveUser, getLeaderboard, addMemory, getMemories, listGuildUsers, resetUser, resetGuild, exportGuild, backup, addCoins, spendCoins, close, hasPostgres, SCHEMA_VERSION, defaultSettings };
