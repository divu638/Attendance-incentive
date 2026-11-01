let token = null;
export const setToken = (t) => { token = t; };

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function call(path, opts = {}) {
  const endpoint = `${API_BASE}/api${path}`;
  const res = await fetch(endpoint, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
  return data;
}

export const api = {
  login: (identifier, password) => call("/auth/login", { method: "POST", body: { identifier, password } }),
  nonce: (address) => call("/auth/nonce?address=" + address),
  verify: (address, signature) => call("/auth/verify", { method: "POST", body: { address, signature } }),
  students: () => call("/students"),
  saveStudent: (body) => call("/students", { method: "POST", body }),
  summary: (address) => call(`/students/${address}/summary`),
  myAttendance: (address) => call(`/students/${address}/attendance`),
  sessions: () => call("/sessions"),
  saveSession: (body) => call("/sessions", { method: "POST", body }),
  attendance: (sessionId) => call("/attendance/" + sessionId),
  stats: () => call("/stats"),
  teachers: () => call("/teachers"),
  rewards: () => call("/rewards"),
  messages: () => call("/messages"),
  sendMessage: (body) => call("/messages", { method: "POST", body }),
  replyMessage: (id, body) => call(`/messages/${id}/reply`, { method: "POST", body }),
  generateSessionCode: (sessionId) => call("/sessions/code", { method: "POST", body: { sessionId } }),
  getSessionCode: () => call("/sessions/code"),
  verifyPresence: (code) => call("/sessions/verify-presence", { method: "POST", body: { code } }),
};
