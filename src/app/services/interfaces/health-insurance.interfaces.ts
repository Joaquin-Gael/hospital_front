/**
 * Estructura base que comparten los modelos de creación, edición y lectura.
 */
interface HealthInsuranceBase {
  /** Nombre de la obra social (máximo 50 caracteres). */
  name: string;
  /** Descripción detallada (máximo 500 caracteres). */
  description: string;
  /** Descuento expresado en porcentaje (de 0 a 100, admite hasta dos decimales). */
  discount: number;
}

/**
 * Datos necesarios para crear una nueva obra social.
 * Usa los campos definidos en el modelo base.
 */
interface HealthInsuranceCreate extends HealthInsuranceBase {}

/**
 * Datos para editar una obra social existente.
 * Todos los campos son opcionales porque se permite actualización parcial.
 */
interface HealthInsuranceUpdate {
  /** Nombre actualizado (opcional). */
  name?: string;
  /** Descripción actualizada (opcional). */
  description?: string;
  /** Descuento actualizado (opcional). */
  discount?: number;
}

/**
 * Datos devueltos por el backend cuando se consulta una obra social.
 * Incluye el ID y los campos base.
 */
interface HealthInsuranceRead extends HealthInsuranceBase {
  /** ID único (UUID) que identifica a la obra social. */
  id: string;
}

/**
 * Estructura que devuelve el backend al eliminar una obra social.
 * Incluye el ID eliminado y un mensaje de confirmación.
 */
interface HealthInsuranceDelete {
  /** ID único (UUID) de la obra social eliminada. */
  id: string;
  /** Mensaje que confirma la eliminación. */
  message: string;
}

export type {
  HealthInsuranceBase,
  HealthInsuranceCreate,
  HealthInsuranceUpdate,
  HealthInsuranceRead,
  HealthInsuranceDelete,
};
