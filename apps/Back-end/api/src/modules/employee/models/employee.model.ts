// Compatibility shim.
//
// The current backend defines the canonical Employee model in `./Employee.ts`
// (default export). Some legacy modules (leave, attendance, ported from the
// previous backend) import `{ Employee, IEmployee }` from `./employee.model`.
// Re-exporting here keeps both import paths working while making sure the
// Mongoose model is registered exactly once.

import EmployeeDefault, { IEmployee } from './Employee';

export const Employee = EmployeeDefault;
export type { IEmployee };
export default EmployeeDefault;
