import { API_BASE } from "../config";

const SESSION_KEY = "mk5_session_id";

function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `mk5_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export async function trackEvent(eventName, payload = {}) {
  try {
    const body = {
      event_name: eventName,
      session_id: getSessionId(),
      page: window.location.pathname,
      ...payload,
    };

    await fetch(`${API_BASE}/api/metrics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // no-op: analytics should never break UX
  }
}
