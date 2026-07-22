// src/mocks/mockFrameworks.ts
// Standard library + tenant frameworks for the performance module.
// Every Functional / Interpersonal / Leadership criterion is worth max 5 marks
// (1–5 score maps 1:1 onto marks via weightedMark = maxMarks × score ÷ 5).

import type { RatingBand, SystemFramework, TenantFramework } from '../types/evaluation';

export const DEFAULT_RATING_BANDS: RatingBand[] = [
  { minPct: 90, maxPct: 100, label: 'Top Performer', color: '#16a34a' },
  { minPct: 70, maxPct: 89, label: 'Exceeds Expectations', color: '#2563eb' },
  { minPct: 50, maxPct: 69, label: 'Meets Expectations', color: '#0d9488' },
  { minPct: 30, maxPct: 49, label: 'Needs Improvement', color: '#ea580c' },
  { minPct: 0, maxPct: 29, label: 'Significantly Underperforms', color: '#dc2626' },
];

/** Fixed max marks per scorecard criterion (Functional / Interpersonal / Leadership). */
export const CRITERION_MAX_MARKS = 5;

type CriterionInput = { _id: string; name: string; order: number };
type CategoryInput = {
  _id: string;
  name: string;
  order?: number;
  criteria: CriterionInput[];
};

function withEqualCriteria(cat: CategoryInput): SystemFramework['categories'][number] {
  const criteria = cat.criteria.map((c) => ({
    ...c,
    maxMarks: CRITERION_MAX_MARKS,
  }));
  return {
    _id: cat._id,
    name: cat.name,
    order: cat.order ?? 0,
    criteria,
    maxMarks: criteria.length * CRITERION_MAX_MARKS,
  };
}

function frameworkTotal(categories: SystemFramework['categories'], goalsMax = 20): number {
  return categories.reduce((sum, c) => sum + c.maxMarks, 0) + goalsMax;
}

const INTERPERSONAL_CATEGORIES = [
  withEqualCriteria({
    _id: 'cat-interpersonal-comm',
    name: 'Communication',
    order: 4,
    criteria: [
      { _id: 'crit-ip-listening', name: 'Active listening and clarity in conversations', order: 1 },
      { _id: 'crit-ip-written', name: 'Written communication and professionalism', order: 2 },
      { _id: 'crit-ip-feedback', name: 'Giving and receiving constructive feedback', order: 3 },
    ],
  }),
  withEqualCriteria({
    _id: 'cat-interpersonal-team',
    name: 'Teamwork & Collaboration',
    order: 5,
    criteria: [
      { _id: 'crit-ip-cooperation', name: 'Cooperates with colleagues across teams', order: 1 },
      { _id: 'crit-ip-conflict', name: 'Handles conflict and differences constructively', order: 2 },
      { _id: 'crit-ip-support', name: 'Supports team goals over individual priorities', order: 3 },
    ],
  }),
];

const LEADERSHIP_CATEGORIES = [
  withEqualCriteria({
    _id: 'cat-leadership-init',
    name: 'Initiative & Ownership',
    order: 6,
    criteria: [
      { _id: 'crit-ld-proactive', name: 'Takes initiative without being prompted', order: 1 },
      { _id: 'crit-ld-accountability', name: 'Demonstrates accountability for outcomes', order: 2 },
      { _id: 'crit-ld-improve', name: 'Identifies and drives process improvements', order: 3 },
    ],
  }),
  withEqualCriteria({
    _id: 'cat-leadership-influence',
    name: 'Influence & Development',
    order: 7,
    criteria: [
      { _id: 'crit-ld-mentor', name: 'Mentors or coaches peers when needed', order: 1 },
      { _id: 'crit-ld-decisions', name: 'Makes sound decisions under pressure', order: 2 },
      { _id: 'crit-ld-vision', name: 'Aligns work with broader team and company goals', order: 3 },
    ],
  }),
];

/** Two functional categories × 3 criteria × 5 = 30 marks. */
function functionalPair(
  a: { id: string; name: string; criteria: [string, string, string]; names: [string, string, string] },
  b: { id: string; name: string; criteria: [string, string, string]; names: [string, string, string] }
): SystemFramework['categories'] {
  return [
    withEqualCriteria({
      _id: a.id,
      name: a.name,
      order: 1,
      criteria: [
        { _id: a.criteria[0], name: a.names[0], order: 1 },
        { _id: a.criteria[1], name: a.names[1], order: 2 },
        { _id: a.criteria[2], name: a.names[2], order: 3 },
      ],
    }),
    withEqualCriteria({
      _id: b.id,
      name: b.name,
      order: 2,
      criteria: [
        { _id: b.criteria[0], name: b.names[0], order: 1 },
        { _id: b.criteria[1], name: b.names[1], order: 2 },
        { _id: b.criteria[2], name: b.names[2], order: 3 },
      ],
    }),
  ];
}

function functionalCategories(deptCriteria: SystemFramework['categories']): SystemFramework['categories'] {
  return deptCriteria.map((c, i) => ({ ...c, order: i + 1 }));
}

function buildFramework(
  partial: Omit<SystemFramework, 'totalMaxMarks' | 'scoringScale' | 'ratingBands'> & {
    scoringScale?: SystemFramework['scoringScale'];
    ratingBands?: RatingBand[];
  }
): SystemFramework {
  return {
    ...partial,
    scoringScale: partial.scoringScale ?? { min: 1, max: 5 },
    ratingBands: partial.ratingBands ?? DEFAULT_RATING_BANDS,
    totalMaxMarks: frameworkTotal(partial.categories),
  };
}

export const mockSystemFrameworks: SystemFramework[] = [
  buildFramework({
    _id: 'sys-fw-master',
    name: 'KagoHC Master KPI Framework',
    department: 'All Departments',
    categories: [
      ...functionalPair(
        {
          id: 'cat-master-delivery',
          name: 'Delivery & Quality',
          criteria: ['crit-master-quality', 'crit-master-timely', 'crit-master-standards'],
          names: [
            'Quality and accuracy of work output',
            'Timely completion of assigned tasks',
            'Adherence to standards and procedures',
          ],
        },
        {
          id: 'cat-master-habits',
          name: 'Work Habits',
          criteria: ['crit-master-punctuality', 'crit-master-attendance', 'crit-master-organisation'],
          names: ['Punctuality and reliability', 'Attendance and availability', 'Organisation and follow-through'],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-cs',
    name: 'Customer Support KPI Framework',
    department: 'Customer Support',
    categories: [
      ...functionalCategories([
        withEqualCriteria({
          _id: 'cat-cs-quality',
          name: 'Quality of Work',
          criteria: [
            { _id: 'crit-cs-responses', name: 'Quality and accuracy of customer responses', order: 1 },
            { _id: 'crit-cs-resolution', name: 'First-contact resolution and ticket handling', order: 2 },
            { _id: 'crit-cs-sla', name: 'Adherence to SLAs and response times', order: 3 },
          ],
        }),
        withEqualCriteria({
          _id: 'cat-cs-habits',
          name: 'Work Habits',
          criteria: [
            { _id: 'crit-cs-punctuality', name: 'Punctuality to workplace', order: 1 },
            { _id: 'crit-cs-attendance', name: 'Attendance', order: 2 },
            { _id: 'crit-cs-documentation', name: 'Ticket documentation and case notes', order: 3 },
            { _id: 'crit-cs-procedures', name: 'Following support procedures and scripts', order: 4 },
          ],
        }),
        withEqualCriteria({
          _id: 'cat-cs-engagement',
          name: 'Customer Engagement',
          criteria: [
            { _id: 'crit-cs-empathy', name: 'Empathy and professionalism with customers', order: 1 },
            { _id: 'crit-cs-escalation', name: 'Appropriate escalation and handoffs', order: 2 },
            { _id: 'crit-cs-satisfaction', name: 'Customer satisfaction and feedback scores', order: 3 },
          ],
        }),
      ]),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-sales',
    name: 'Sales KPI Framework',
    department: 'Sales',
    categories: [
      ...functionalPair(
        {
          id: 'cat-sales-pipeline',
          name: 'Pipeline & Revenue',
          criteria: ['crit-sales-targets', 'crit-sales-pipeline', 'crit-sales-deals'],
          names: [
            'Achievement of sales targets',
            'Pipeline management and forecasting',
            'Deal closure and negotiation',
          ],
        },
        {
          id: 'cat-sales-crm',
          name: 'CRM & Activity',
          criteria: ['crit-sales-crm', 'crit-sales-prospecting', 'crit-sales-presentations'],
          names: [
            'CRM hygiene and activity logging',
            'Prospecting and lead follow-up',
            'Presentations and product knowledge',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-finance',
    name: 'Finance KPI Framework',
    department: 'Finance',
    categories: [
      ...functionalPair(
        {
          id: 'cat-fin-accuracy',
          name: 'Accuracy & Compliance',
          criteria: ['crit-fin-reports', 'crit-fin-compliance', 'crit-fin-reconciliation'],
          names: [
            'Accuracy of financial reports',
            'Regulatory and policy compliance',
            'Reconciliation and audit readiness',
          ],
        },
        {
          id: 'cat-fin-analysis',
          name: 'Analysis & Planning',
          criteria: ['crit-fin-budget', 'crit-fin-insights', 'crit-fin-deadlines'],
          names: [
            'Budgeting and variance analysis',
            'Financial insights for stakeholders',
            'Month-end and reporting deadlines',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-hr',
    name: 'Human Capital / HR KPI Framework',
    department: 'Human Capital',
    categories: [
      ...functionalPair(
        {
          id: 'cat-hc-service',
          name: 'Service Delivery',
          criteria: ['crit-hc-response', 'crit-hc-accuracy', 'crit-hc-policies'],
          names: [
            'Turnaround time on employee queries',
            'Accuracy of records and payroll inputs',
            'Policy administration and documentation',
          ],
        },
        {
          id: 'cat-hc-talent',
          name: 'Talent & Engagement',
          criteria: ['crit-hc-recruitment', 'crit-hc-engagement', 'crit-hc-development'],
          names: [
            'Recruitment and onboarding support',
            'Employee engagement initiatives',
            'Learning and development coordination',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-it',
    name: 'IT / Engineering KPI Framework',
    department: 'IT / Engineering',
    categories: [
      ...functionalPair(
        {
          id: 'cat-it-quality',
          name: 'Quality of Work',
          criteria: ['crit-it-code', 'crit-it-standards', 'crit-it-delivery'],
          names: [
            'Code quality, correctness and test coverage',
            'Adherence to standards, documentation and security',
            'Timely delivery of features and tickets',
          ],
        },
        {
          id: 'cat-it-ops',
          name: 'Operations & Reliability',
          criteria: ['crit-it-incidents', 'crit-it-monitoring', 'crit-it-automation'],
          names: [
            'Incident response and resolution',
            'Monitoring, alerting and uptime',
            'Automation and continuous improvement',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-ops',
    name: 'Operations KPI Framework',
    department: 'Operations',
    categories: [
      ...functionalPair(
        {
          id: 'cat-ops-efficiency',
          name: 'Operational Efficiency',
          criteria: ['crit-ops-throughput', 'crit-ops-quality', 'crit-ops-safety'],
          names: [
            'Throughput and productivity targets',
            'Quality control and error rates',
            'Safety and compliance procedures',
          ],
        },
        {
          id: 'cat-ops-planning',
          name: 'Planning & Execution',
          criteria: ['crit-ops-scheduling', 'crit-ops-inventory', 'crit-ops-reporting'],
          names: [
            'Scheduling and resource planning',
            'Inventory and supply coordination',
            'Operational reporting and KPIs',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
  buildFramework({
    _id: 'sys-fw-marketing',
    name: 'Marketing KPI Framework',
    department: 'Marketing',
    categories: [
      ...functionalPair(
        {
          id: 'cat-mkt-campaigns',
          name: 'Campaign Execution',
          criteria: ['crit-mkt-campaigns', 'crit-mkt-content', 'crit-mkt-channels'],
          names: [
            'Campaign planning and delivery',
            'Content quality and brand consistency',
            'Channel performance and optimisation',
          ],
        },
        {
          id: 'cat-mkt-analytics',
          name: 'Analytics & Insights',
          criteria: ['crit-mkt-metrics', 'crit-mkt-segmentation', 'crit-mkt-roi'],
          names: [
            'Tracking and reporting on marketing metrics',
            'Audience segmentation and targeting',
            'ROI analysis and budget stewardship',
          ],
        }
      ),
      ...INTERPERSONAL_CATEGORIES,
      ...LEADERSHIP_CATEGORIES,
    ],
  }),
];

export const mockTenantFrameworks: TenantFramework[] = [
  {
    ...mockSystemFrameworks[1],
    _id: 'tenant-fw-cs-1',
    sourceFrameworkId: 'sys-fw-cs',
    status: 'published',
    version: 1,
  },
];

/**
 * Map category order → pillar.
 * maxMarks here is a fallback; summaries prefer summing category maxMarks from the snapshot.
 * Standard frameworks: Functional 30 · Interpersonal 30 · Leadership 30 (+ Goals 20 = 110).
 * CS functional has 10 criteria → 50.
 */
export const PILLAR_BY_ORDER: Record<number, { key: string; label: string; maxMarks: number }> = {
  1: { key: 'functional', label: 'FUNCTIONAL', maxMarks: 30 },
  2: { key: 'functional', label: 'FUNCTIONAL', maxMarks: 30 },
  3: { key: 'functional', label: 'FUNCTIONAL', maxMarks: 50 },
  4: { key: 'interpersonal', label: 'INTERPERSONAL', maxMarks: 30 },
  5: { key: 'interpersonal', label: 'INTERPERSONAL', maxMarks: 30 },
  6: { key: 'leadership', label: 'LEADERSHIP', maxMarks: 30 },
  7: { key: 'leadership', label: 'LEADERSHIP', maxMarks: 30 },
};

export const GOALS_PILLAR = { key: 'goals', label: 'GOALS', maxMarks: 20 };

export function systemFrameworkToSnapshot(fw: SystemFramework, tenantFrameworkId: string, version = 1) {
  return {
    tenantFrameworkId,
    version,
    name: fw.name,
    department: fw.department,
    totalMaxMarks: fw.totalMaxMarks,
    scoringScale: fw.scoringScale,
    ratingBands: fw.ratingBands,
    categories: fw.categories.map((cat) => ({
      categoryId: cat._id,
      name: cat.name,
      maxMarks: cat.maxMarks,
      order: cat.order ?? 0,
      criteria: cat.criteria.map((crit) => ({
        criterionId: crit._id,
        name: crit.name,
        maxMarks: crit.maxMarks,
        order: crit.order ?? 0,
      })),
    })),
  };
}
