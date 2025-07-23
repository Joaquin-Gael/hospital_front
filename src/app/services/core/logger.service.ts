import { Injectable, isDevMode } from '@angular/core';

// Definimos los niveles de log posibles, lo clásico pa' saber qué tanto queremos gritar
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Jerarquía de niveles: mientras menor el número, más importante el mensaje
const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly APP_PREFIX = '[JifTubeApp]';
  private readonly minLogLevel: LogLevel;

  constructor() {
    // Si estamos en modo desarrollo, queremos ver todo (hasta los suspiros)
    // Pero en producción, solo mostramos los errores
    this.minLogLevel = isDevMode() ? 'debug' : 'error';
  }

  /**
   * Log específico para errores: lo que no debería pasar, pero pasa
   */
  error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  /**
   * Log para advertencias: no explota, pero ojo que algo no va del todo bien
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log para info general: cosas que uno quiere tener en el radar
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log más detallado: solo para desarrollo y cazadores de bugs
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Método que maneja todo el log: valida, formatea, imprime y deja listo para enviar al backend
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(level, message);
      this.outputLog(level, formattedMessage, data);
    }
  }

  /**
   * Evalúa si el nivel del log pasa el filtro actual
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[level] <= LOG_LEVEL_PRIORITIES[this.minLogLevel];
  }

  /**
   * Se encarga de dejar bonito el mensaje: prefijo, nivel y hora exacta
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.APP_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`;
  }

  /**
   * Acá se hace la magia con el `console` nativo según el nivel del log
   */
  private outputLog(level: LogLevel, message: string, data?: unknown): void {
    switch (level) {
      case 'error':
        console.error(message, data);
        break;
      case 'warn':
        console.warn(message, data);
        break;
      case 'info':
        console.info(message, data);
        break;
      case 'debug':
        console.debug(message, data);
        break;
    }
  }
}
