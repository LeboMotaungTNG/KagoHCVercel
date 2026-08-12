// src/api/frameworks.api.ts
// Framework endpoints with optional mock support.

import { http, USE_MOCKS } from './httpClient';
import {
  mockSystemFrameworks,
  mockTenantFrameworks,
} from '../mocks/mockFrameworks';
import type {
  SystemFramework,
  TenantFramework,
  ValidationResult,
  Category,
} from '../types/evaluation';

// simple in-memory store so the mock behaves statefully during a dev session
let tenantFrameworksStore = [...mockTenantFrameworks];

function sleep(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FrameworkAssignment {
  _id?: string;
  frameworkId: string;
  scope: 'department' | 'role' | 'employee';
  department?: string;
  roleId?: string;
  employeeId?: string;
  assignedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* System Frameworks                                                          */
/* -------------------------------------------------------------------------- */

// GET /frameworks
export async function listSystemFrameworks(): Promise<SystemFramework[]> {
  if (USE_MOCKS) {
    await sleep();
    return mockSystemFrameworks;
  }

  return http.get<SystemFramework[]>('/frameworks');
}

/* -------------------------------------------------------------------------- */
/* Tenant Frameworks                                                          */
/* -------------------------------------------------------------------------- */

// POST /tenant/frameworks
export async function adoptFramework(
  sourceFrameworkId: string
): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();

    const source = mockSystemFrameworks.find(
      (f) => f._id === sourceFrameworkId
    );

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

  return http.post<TenantFramework>(
    '/tenant/frameworks',
    { sourceFrameworkId }
  );
}

// GET /tenant/frameworks
export async function listTenantFrameworks(): Promise<TenantFramework[]> {
  if (USE_MOCKS) {
    await sleep();
    return tenantFrameworksStore;
  }

  return http.get<TenantFramework[]>('/tenant/frameworks');
}

// GET /tenant/frameworks/:id
export async function getTenantFramework(
  id: string
): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();

    const found = tenantFrameworksStore.find(
      (f) => f._id === id
    );

    if (!found) throw new Error('Tenant framework not found');

    return found;
  }

  return http.get<TenantFramework>(
    `/tenant/frameworks/${id}`
  );
}

// PUT /tenant/frameworks/:id
export async function updateTenantFramework(
  id: string,
  patch: { categories: Category[] }
): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();

    tenantFrameworksStore = tenantFrameworksStore.map((f) =>
      f._id === id ? { ...f, categories: patch.categories } : f
    );

    return tenantFrameworksStore.find(
      (f) => f._id === id
    )!;
  }

  return http.put<TenantFramework>(
    `/tenant/frameworks/${id}`,
    patch
  );
}

/* -------------------------------------------------------------------------- */
/* Validation / Publishing                                                    */
/* -------------------------------------------------------------------------- */

// POST /tenant/frameworks/:id/validate
export async function validateFramework(
  id: string
): Promise<ValidationResult> {
  if (USE_MOCKS) {
    await sleep();

    const fw = tenantFrameworksStore.find(
      (f) => f._id === id
    );

    if (!fw) throw new Error('Tenant framework not found');

    const errors: string[] = [];

    fw.categories.forEach((cat) => {
      const critSum = cat.criteria.reduce(
        (sum, c) => sum + c.maxMarks,
        0
      );

      if (critSum !== cat.maxMarks) {
        errors.push(
          `Category '${cat.name}' maxMarks (${cat.maxMarks}) does not match sum of criteria (${critSum})`
        );
      }
    });

    const catSum = fw.categories.reduce(
      (sum, c) => sum + c.maxMarks,
      0
    );

    if (catSum !== 80) {
      errors.push(
        `Category maxMarks sum to ${catSum}, not 80 (goals contribute 20 toward 100)`
      );
    }

    return {
      success: true,
      valid: errors.length === 0,
      errors,
    };
  }

  return http.post<ValidationResult>(
    `/tenant/frameworks/${id}/validate`
  );
}

// POST /tenant/frameworks/:id/publish
export async function publishFramework(
  id: string
): Promise<TenantFramework> {
  if (USE_MOCKS) {
    await sleep();

    tenantFrameworksStore = tenantFrameworksStore.map((f) =>
      f._id === id
        ? {
            ...f,
            status: 'published',
            version: f.version + 1,
          }
        : f
    );

    return tenantFrameworksStore.find(
      (f) => f._id === id
    )!;
  }

  return http.post<TenantFramework>(
    `/tenant/frameworks/${id}/publish`
  );
}

/* -------------------------------------------------------------------------- */
/* Assignments                                                                */
/* -------------------------------------------------------------------------- */

export type AssignPayload =
  | { scope: 'department'; department: string }
  | { scope: 'employee'; employeeId: string };

// POST /tenant/frameworks/:id/assign
export async function assignFramework(
  id: string,
  payload: AssignPayload
): Promise<void> {
  if (USE_MOCKS) {
    await sleep();
    return;
  }

  return http.post<void>(
    `/tenant/frameworks/${id}/assign`,
    payload
  );
}

// GET /tenant/frameworks/assignments
export async function listAssignments(): Promise<FrameworkAssignment[]> {
  if (USE_MOCKS) {
    await sleep();
    return [];
  }

  return http.get<FrameworkAssignment[]>(
    '/tenant/frameworks/assignments'
  );
}

/* -------------------------------------------------------------------------- */
/* Convenience Workflow                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One-click activate:
 * adopt (if needed) → publish (if draft) → assign to department.
 */
export async function activateFramework(
  sourceFrameworkId: string,
  department: string,
  existing?: TenantFramework | null
): Promise<TenantFramework> {
  const dept = department.trim();

  if (!dept) {
    throw new Error(
      'Select a department to activate this framework.'
    );
  }

  let fw = existing ?? null;

  if (!fw) {
    fw = await adoptFramework(sourceFrameworkId);
  }

  if (fw.status === 'draft') {
    try {
      fw = await publishFramework(fw._id);
    } catch (err) {
      // Already published on another request — reload and continue.
      const message =
        err instanceof Error ? err.message : '';

      if (!/already published/i.test(message)) {
        throw err;
      }

      fw = await getTenantFramework(fw._id);
    }
  }

  if (fw.status !== 'published') {
    throw new Error(
      'Framework could not be published. Open Customise to fix weights, then try again.'
    );
  }

  await assignFramework(
    fw._id,
    { scope: 'department', department: dept }
  );

  return fw;
}