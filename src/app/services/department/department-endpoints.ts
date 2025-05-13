export const DEPARTMENT_ENDPOINTS = {
  GET_ALL: 'departments',
  GET_BY_ID: (departmentId: number) => `departments/${departmentId}`,
  ADD: 'departments/add',
  DELETE: (departmentId: number) => `departments/delete/${departmentId}`,
  UPDATE: (departmentId: number) => `departments/update/${departmentId}`,
} as const;