/**
 * Endpoints del backend relacionados a la gestión de obras sociales.
 * Se usan para consumir los datos desde el servicio correspondiente.
 */
export const HEALTH_INSURANCE_ENDPOINTS = {
  /** Trae todas las obras sociales registradas. */
  getAll: 'health_insurance/',

  /** Trae los datos de una obra social específica según su ID. */
  getById: (hi_id: string) => `health_insurance/detail/${hi_id}`,

  /** Crea una nueva obra social. */
  create: 'health_insurance/create',

  /** Edita parcialmente una obra social (PATCH). */
  update: (hi_id: string) => `health_insurance/update/${hi_id}`,

  /** Elimina una obra social según su ID. */
  delete: (hi_id: string) => `health_insurance/delete/${hi_id}`,
} as const;
