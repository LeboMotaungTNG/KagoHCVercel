import { API_URL } from "./employee";

export type PiiField = "id_number" | "bank_account" | "tax_number" | "company_account";

export type PiiRevealEvent = {
  at: string;
  field: PiiField;
  subjectId?: string;
  subjectName?: string;
  last4: string;
  actorEmail?: string;
  actorName?: string;
};

const STORAGE_KEY = "kago-pii-reveals";

const readActor = (): { email?: string; name?: string } => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return { email: user.email, name: name || user.name };
  } catch {
    return {};
  }
};

export function last4(value?: string | null): string {
  const digits = String(value || "").replace(/\s+/g, "");
  if (!digits) return "";
  return digits.slice(-4);
}

export function maskLast4(value?: string | null): string {
  const tail = last4(value);
  return tail ? `••••${tail}` : "";
}

export function loadPiiReveals(): PiiRevealEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Record who viewed a sensitive number. Never stores the full value. */
export async function recordPiiReveal(input: {
  field: PiiField;
  value?: string | null;
  subjectId?: string;
  subjectName?: string;
}): Promise<void> {
  const actor = readActor();
  const event: PiiRevealEvent = {
    at: new Date().toISOString(),
    field: input.field,
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    last4: last4(input.value),
    actorEmail: actor.email,
    actorName: actor.name,
  };

  const next = [event, ...loadPiiReveals()].slice(0, 200);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }

  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    await fetch(`${API_URL}/logs/audit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pii.reveal",
        category: "Compliance",
        resource: "employee",
        message: `${actor.email || actor.name || "Someone"} revealed ${input.field} ending ${event.last4}`,
        details: {
          field: input.field,
          subjectId: input.subjectId,
          subjectName: input.subjectName,
          last4: event.last4,
        },
      }),
    });
  } catch {
    /* local trail is enough if the audit API is missing */
  }
}
