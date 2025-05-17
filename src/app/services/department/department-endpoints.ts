export const DEPARTMENT_ENDPOINTS = {
  GET_ALL: 'medic/departments',
  GET_BY_ID: (departmentId: string) => `medic/departments/${departmentId}`,
  ADD: 'medic/departments/add',
  DELETE: (departmentId: string) => `medic/departments/delete/${departmentId}`,
  UPDATE: (departmentId: string) => `medic/departments/update/${departmentId}`,
} as const;