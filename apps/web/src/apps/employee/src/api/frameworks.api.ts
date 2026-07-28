// src/api/frameworks.api.ts
// Endpoints 1–6 from the handoff. Every function has the same signature
// whether USE_MOCKS is on or off, so Screens 1 & 2 don't need to change
// once Stage 2 (framework controllers) ships.

import { http, USE_MOCKS } from './httpClient';
import { mockSystemFrameworks, mockTenantFrameworks } from '../mocks/mockFrameworks';
import type { SystemFramework, TenantFramework, ValidationResult, Category } from '../types/evaluation';

// simple in-memory store so the mock behaves statefully during a dev session
let tenantFrameworksStore = [...mockTenantFrameworks];

function sleep(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. GET /frameworks
export async function listSystemFrameworks(): Promise<SystemFramework[]> {
  if (USE_MOCKS) {
    await sleep();
    return mockSystemFrameworks;
  }
  return http.get<SystemFramework[]>('/frameworks');
}

// 2. POST /tenant/frameworks
export async function adoptFramework(sourceFrameworkId: string): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();
    const source = mockSystemFrameworks.find((f) => f._id === sourceFrameworkId);
    if (!source) throw new Error('Source framework not found');
    const cloned: TenantFramework = {
      ...source,
      _id: `tenant-fw-${Date.now()}`,
      sourceFrameworkId,
      status: 'draft',
      version: 1,
    };
    tenantFrameworksStore = [...tenantFrameworksStore, cloned];
    return cloned;
  }
  return http.post<TenantFramework>('/tenant/frameworks', { sourceFrameworkId });
}

// GET /tenant/frameworks (not explicitly in the handoff numbering, but needed
// to populate Screen 1's "tenant's adopted frameworks" list)
export async function listTenantFrameworks(): Promise<TenantFramework[]> {
  if (USE_MOCKS) {
    await sleep();
    return tenantFrameworksStore;
  }
  return http.get<TenantFramework[]>('/tenant/frameworks');
}

// 3. GET /tenant/frameworks/:id
export async function getTenantFramework(id: string): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();
    const found = tenantFrameworksStore.find((f) => f._id === id);
    if (!found) throw new Error('Tenant framework not found');
    return found;
  }
  return http.get<TenantFramework>(`/tenant/frameworks/${id}`);
}

// 3. PUT /tenant/frameworks/:id
export async function updateTenantFramework(
  id: string,
  patch: { categories: Category[] }
): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();
    tenantFrameworksStore = tenantFrameworksStore.map((f) =>
      f._id === id ? { ...f, categories: patch.categories } : f
    );
    return tenantFrameworksStore.find((f) => f._id === id)!;
  }
  return http.put<TenantFramework>(`/tenant/frameworks/${id}`, patch);
}

// 4. POST /tenant/frameworks/:id/validate
export async function validateFramework(id: string): Promise<ValidationResult> {
  if (USE_MOCKS) {
    await sleep();
    const fw = tenantFrameworksStore.find((f) => f._id === id);
    if (!fw) throw new Error('Tenant framework not found');
    const errors: string[] = [];
    fw.categories.forEach((cat) => {
      const critSum = cat.criteria.reduce((sum, c) => sum + c.maxMarks, 0);
      if (critSum !== cat.maxMarks) {
        errors.push(`Category '${cat.name}' maxMarks (${cat.maxMarks}) does not match sum of criteria (${critSum})`);
      }
    });
    const catSum = fw.categories.reduce((sum, c) => sum + c.maxMarks, 0);
    if (catSum !== 80) {
      errors.push(`Category maxMarks sum to ${catSum}, not 80 (goals contribute 20 toward 100)`);
    }
    return { success: true, valid: errors.length === 0, errors };
  }
  return http.post<ValidationResult>(`/tenant/frameworks/${id}/validate`);
}

// 5. POST /tenant/frameworks/:id/publish
export async function publishFramework(id: string): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();
    tenantFrameworksStore = tenantFrameworksStore.map((f) =>
      f._id === id ? { ...f, status: 'published', version: f.version + 1 } : f
    );
    return tenantFrameworksStore.find((f) => f._id === id)!;
  }
  return http.post<TenantFramework>(`/tenant/frameworks/${id}/publish`);
}

// 6. POST /tenant/frameworks/:id/assign
export type AssignPayload =
  | { scope: 'department'; department: string }
  | { scope: 'employee'; employeeId: string };

export async function assignFramework(id: string, payload: AssignPayload): Promise<void> {
  if (USE_MOCKS) {
    await sleep();
    return;
  }
  return http.post<void>(`/tenant/frameworks/${id}/assign`, payload);
}

/**
 * One-click activate: adopt (if needed) → publish (if draft) → assign to department.
 * System frameworks are already weight-valid, so owners can skip the builder.
 */
export async function activateFramework(
  sourceFrameworkId: string,
  department: string,
  existing?: TenantFramework | null
): Promise<TenantFramework> {
  const dept = department.trim();
  if (!dept) throw new Error('Select a department to activate this framework.');

  let fw = existing ?? null;

  if (!fw) {
    fw = await adoptFramework(sourceFrameworkId);
  }

  if (fw.status === 'draft') {
    try {
      fw = await publishFramework(fw._id);
    } catch (err) {
      // Already published on another request — reload and continue to assign
      const message = err instanceof Error ? err.message : '';
      if (!/already published/i.test(message)) throw err;
      fw = await getTenantFramework(fw._id);
    }
  }

  if (fw.status !== 'published') {
    throw new Error('Framework could not be published. Open Customise to fix weights, then try again.');
  }

  await assignFramework(fw._id, { scope: 'department', department: dept });
  return fw;
}
