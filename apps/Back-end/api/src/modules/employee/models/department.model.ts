// Compatibility shim.
//
// The canonical Department model is registered in
// `modules/owner/models/Department.model.ts`. Several legacy modules import
// `{ Department }` (and one uses `DepartmentModel`) from this file, so we
// re-export here to keep the model registered exactly once.

import { Department as OwnerDepartment, IDepartment } from '../../owner/models/Department.model';

export const Department = OwnerDepartment;
export const DepartmentModel = OwnerDepartment;
export type { IDepartment };
export default OwnerDepartment;
