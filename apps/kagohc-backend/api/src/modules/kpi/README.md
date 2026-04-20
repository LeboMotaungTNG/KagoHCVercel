# KPI Management System Documentation

## Overview

Complete KPI (Key Performance Indicator) management system with:
- Period-based assessments (quarterly, annual, monthly)
- Automated period status transitions
- Manager review workflows
- Employee self-assessments
- Auto-locking of expired periods

## Database Schema Updates

### KpiPeriod Model
```typescript
interface IKpiPeriod {
  name: string;
  type: 'quarterly' | 'annual' | 'monthly';
  openDate: Date;           // When employees can start submitting
  closeDate: Date;          // Deadline for submissions
  reviewStartDate: Date;    // When managers start reviewing
  reviewEndDate: Date;      // When review period ends
  status: 'upcoming' | 'open' | 'review' | 'closed';
  isLocked: boolean;        // Manual lock to prevent changes
}
```

### KpiAssessment Model (Updated)
Added fields:
- `periodId` - Reference to KpiPeriod (required, unique with employeeId)
- `status` - Extended: `'draft' | 'submitted' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'locked'`
- `submittedAt`, `reviewedAt`, `lockedAt` - Workflow timestamps
- `employeeComment`, `managerComment` - Comments at each stage
- `reviewedBy` - Track who reviewed

## Workflow

### Period Lifecycle
```
1. UPCOMING (Before openDate)
   └→ Employees cannot submit

2. OPEN (Between openDate - closeDate)
   └→ Employees submit assessments

3. REVIEW (Between closeDate - reviewEndDate)
   └→ Managers review submissions

4. CLOSED (After reviewEndDate)
   └→ No changes allowed
   └→ Auto-lock if past reviewEndDate

5. LOCKED (Manual lock)
   └→ All assessments locked
```

### Assessment Status Flow
```
draft → submitted → under_review → reviewed → approved
                ↘                      ↙
                    → rejected
                            ↓
                        locked (if period locked)
```

## API Endpoints

### Period Management

```
GET    /api/v1/kpi/periods
       Get all periods

GET    /api/v1/kpi/periods/:id
       Get specific period

GET    /api/v1/kpi/periods/current
       Get currently active period

GET    /api/v1/kpi/periods/:id/status
       Get detailed period status with days remaining

POST   /api/v1/kpi/periods
       Create new period (admin/hr only)
       Body: { name, type, openDate, closeDate, reviewStartDate, reviewEndDate }

PUT    /api/v1/kpi/periods/:id
       Update period (admin/hr only)

POST   /api/v1/kpi/periods/:id/lock
       Lock period manually (admin/hr only)

POST   /api/v1/kpi/periods/process-locks
       Process auto-locks (admin only, called by cron)
```

### Assessment Management

```
POST   /api/v1/kpi/assessments
       Create new assessment for employee

GET    /api/v1/kpi/assessments/:id
       Get assessment details

GET    /api/v1/kpi/assessments/me
       Get my assessments (for logged-in employee)

POST   /api/v1/kpi/assessments/:id/submit
       Submit assessment for review
       Validates: period is open, ownership check

GET    /api/v1/kpi/periods/:periodId/assessments
       Get all assessments for a period (manager/hr)
```

## Setup Instructions

### 1. Ensure Models are Updated
- ✅ KpiPeriod - reviewStartDate, reviewEndDate added
- ✅ KpiAssessment - periodId, workflow fields added

### 2. Run Seed Script
```bash
npm run seed:kpi
```

Creates:
- 3 KPI templates (Productivity, Quality, Attendance)
- 3 KPI periods (Q1 2026, Q2 2026, Current Active)

### 3. Start Server
```bash
npm run dev
```

### 4. Test Endpoints

```bash
# Get all periods
curl http://localhost:4000/api/v1/kpi/periods

# Get current active period
curl http://localhost:4000/api/v1/kpi/periods/current

# Get period status
curl http://localhost:4000/api/v1/kpi/periods/{periodId}/status

# Create assessment (requires auth)
curl -X POST http://localhost:4000/api/v1/kpi/assessments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "periodId": "{periodId}",
    "templateId": "{templateId}",
    "employeeId": "{employeeId}"
  }'

# Submit assessment
curl -X POST http://localhost:4000/api/v1/kpi/assessments/{assessmentId}/submit \
  -H "Authorization: Bearer {token}"
```

## Cron Jobs

### Daily Auto-Lock (1 AM)
Runs every day at 1:00 AM:
- Updates period statuses based on dates
- Locks periods past reviewEndDate
- Locks all draft/submitted assessments in locked periods
- Logs results

## Service Methods

### KpiService

**Period Management:**
- `createPeriod(data, userId)` - Create new period
- `getPeriods(filters)` - List all periods
- `getCurrentPeriod()` - Get active period
- `getPeriodById(id)` - Get specific period
- `updatePeriod(id, data, userId)` - Update period
- `lockPeriod(id, userId)` - Manual lock
- `processAutoLocks()` - Auto-lock expired periods
- `getPeriodStatus(id)` - Status with details

**Validation:**
- `canSubmitAssessment(periodId)` - Check submission allowed
- `canReviewAssessment(periodId)` - Check review allowed

**Assessments:**
- `createAssessment(data, employeeId, createdBy)` - Create
- `submitAssessment(assessmentId, employeeId)` - Submit
- `getEmployeeAssessments(employeeId, filters)` - Get employee's
- `getPeriodAssessments(periodId, filters)` - Get period's

## Error Handling

Common errors and what they mean:

```
"Period not found"
  → Invalid periodId, doesn't exist

"Submissions open on 2026-01-01"
  → Period hasn't started yet

"Submission deadline has passed"
  → closeDate has passed

"Period is locked"
  → Period is manually locked

"Assessment already exists for this period"
  → Employee already has assessment for this period

"Not authorized"
  → Not the assessment owner
```

## Testing Checklist

- [ ] Create period with future dates
- [ ] Period status shows "upcoming"
- [ ] Create period with current dates
- [ ] Period status shows "open"
- [ ] Create assessment in open period
- [ ] Submit assessment before deadline
- [ ] Try submit after deadline (should fail)
- [ ] Manual lock period
- [ ] Verify assessments get locked
- [ ] Cron job runs daily at 1 AM

## Files Modified/Created

```
models/
  ├── KpiPeriod.ts (UPDATED - added reviewStartDate/reviewEndDate)
  └── KpiAssessment.ts (UPDATED - added periodId and workflow fields)

services/
  └── kpi.service.ts (UPDATED - added period management & validation)

controllers/
  └── kpi.controller.ts (UPDATED - added period controllers)

routes/
  └── kpi.routes.ts (UPDATED - new period routes)

cron/
  └── kpi-cron.ts (NEW - auto-lock job)

scripts/
  └── seed-kpi.ts (NEW - test data)

package.json (UPDATED - added seed:kpi script)
```

## Next Steps

1. ✅ Models updated
2. ✅ Service methods added
3. ✅ Routes defined
4. ✅ Cron job created
5. ✅ Seed script added
6. 🔄 Test with seed data
7. 🔄 Integrate with frontend

