const API_URL = (import.meta as any).env?.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

export interface VerificationChecklistItem {
  key: string;
  label: string;
  section: string;
  done: boolean;
  hint?: string;
}

export interface VerificationDocument {
  id: string;
  type: "identity" | "proof_of_address";
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

export interface ProfileCompletion {
  status: "incomplete" | "pending_verification" | "verified" | "rejected";
  modulesUnlocked: boolean;
  earlyAccessGranted: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  progress: { done: number; total: number; percent: number };
  checklist: VerificationChecklistItem[];
  documents: Partial<Record<"identity" | "proof_of_address", VerificationDocument>>;
  rejectionReasons: Array<{ item: string; reason: string }>;
  pendingBankDetails?: { bankName?: string; bankAccountNumber?: string; bankBranchCode?: string } | null;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  idNumber: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  phone: string;
  address: { street: string; suburb: string; city: string; province: string; postalCode: string; country: string };
  emergencyContact: { name: string; relationship: string; phone: string; email: string };
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
}

export const profileFormFromExisting = (profile: any): ProfileFormData => {
  const notPlaceholder = (value: unknown) => {
    const text = String(value ?? "").trim();
    return /^(n\/a|na|none|null|undefined|-)$/i.test(text) ? "" : text;
  };
  return {
    firstName: profile?.personal?.firstName || "",
    lastName: profile?.personal?.lastName || "",
    idNumber: profile?.personal?.idNumber || "",
    passportNumber: profile?.personal?.passportNumber || "",
    dateOfBirth: profile?.personal?.dateOfBirth?.slice?.(0, 10) || "",
    gender: profile?.personal?.gender || "",
    nationality: profile?.personal?.nationality || "",
    phone: notPlaceholder(profile?.contact?.personalPhone || profile?.contact?.workPhone),
    address: {
      street: notPlaceholder(profile?.contact?.address),
      suburb: "",
      city: notPlaceholder(profile?.contact?.city),
      province: notPlaceholder(profile?.contact?.province),
      postalCode: notPlaceholder(profile?.contact?.postalCode),
      country: profile?.contact?.country || "South Africa",
    },
    emergencyContact: {
      name: profile?.emergency?.name || "",
      relationship: profile?.emergency?.relationship || "",
      phone: profile?.emergency?.phone || "",
      email: profile?.emergency?.email || "",
    },
    bankName: notPlaceholder(profile?.banking?.bankName),
    bankAccountNumber: notPlaceholder(profile?.banking?.accountNumber),
    bankBranchCode: notPlaceholder(profile?.banking?.branchCode),
  };
};

const authHeaders = (token: string): HeadersInit => ({ Authorization: `Bearer ${token}` });

async function readResponse(response: Response): Promise<any> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    const message = body?.message || `Request failed (${response.status})`;
    const fields = body?.fieldErrors ? Object.values(body.fieldErrors).join(" ") : "";
    throw new Error(fields ? `${message} ${fields}` : message);
  }
  return body;
}

export async function fetchProfileCompletion(token: string): Promise<ProfileCompletion> {
  const response = await fetch(`${API_URL}/employees/me/profile-completion`, { headers: authHeaders(token) });
  const body = await readResponse(response);
  return body.data as ProfileCompletion;
}

export async function saveVerificationProfile(token: string, values: ProfileFormData): Promise<ProfileCompletion> {
  const response = await fetch(`${API_URL}/employees/me/profile`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const body = await readResponse(response);
  return body.data as ProfileCompletion;
}

export async function uploadVerificationDocument(token: string, type: "identity" | "proof_of_address", file: File): Promise<ProfileCompletion> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/employees/me/verification-documents/${type}`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  const body = await readResponse(response);
  return body.data?.completion as ProfileCompletion;
}

export async function submitProfileForVerification(token: string): Promise<ProfileCompletion> {
  const response = await fetch(`${API_URL}/employees/me/profile/submit`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await readResponse(response);
  return body.data as ProfileCompletion;
}

export interface VerificationQueueEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  startDate?: string;
  status: string;
  submittedAt?: string;
  earlyAccessGranted: boolean;
  hasPendingBankChange: boolean;
}

export async function fetchVerificationQueue(token: string): Promise<{ counts: Record<string, number>; employees: VerificationQueueEmployee[] }> {
  const response = await fetch(`${API_URL}/employees/verification/queue?status=needs_review`, { headers: authHeaders(token) });
  const body = await readResponse(response);
  return body.data;
}

export async function fetchEmployeeVerification(token: string, employeeId: string): Promise<any> {
  const response = await fetch(`${API_URL}/employees/${employeeId}/verification`, { headers: authHeaders(token) });
  const body = await readResponse(response);
  return body.data;
}

export async function fetchVerificationDocument(token: string, employeeId: string, documentId: string): Promise<any> {
  const response = await fetch(`${API_URL}/employees/${employeeId}/verification-documents/${documentId}`, { headers: authHeaders(token) });
  const body = await readResponse(response);
  return body.data;
}

export async function reviewEmployeeProfile(token: string, employeeId: string, action: "approve" | "reject", reasons?: Array<{ item: string; reason: string }>): Promise<void> {
  const response = await fetch(`${API_URL}/employees/${employeeId}/verification/${action}`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(action === "reject" ? { reasons } : {}),
  });
  await readResponse(response);
}

export async function grantEmployeeEarlyAccess(token: string, employeeId: string, granted: boolean): Promise<void> {
  const response = await fetch(`${API_URL}/employees/${employeeId}/verification/early-access`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ granted }),
  });
  await readResponse(response);
}
