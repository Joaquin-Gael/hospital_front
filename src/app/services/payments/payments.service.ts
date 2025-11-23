import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { PAYMENTS_ENDPOINTS } from './payments-endpoints';
import {
  PaymentCreatePayload,
  PaymentRead,
  PaymentStatusUpdatePayload,
} from '../interfaces/payment.interfaces';
import { TurnPaymentResponse } from '../interfaces/appointment.interfaces';

type QueryValue = string | number | boolean | Array<string | number | boolean>;

type QueryParamsInput =
  | HttpParams
  | Record<string, QueryValue | null | undefined>;

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);

  list(params?: QueryParamsInput): Observable<PaymentRead[]> {
    const httpParams = this.normalizeParams(params);

    return this.apiService
      .get<PaymentRead[]>(PAYMENTS_ENDPOINTS.list(), { params: httpParams })
      .pipe(
        map((response) => response ?? []),
        catchError((error) => this.handleError('Failed to fetch payments', error))
      );
  }

  get(paymentId: string): Observable<PaymentRead> {
    return this.apiService.get<PaymentRead>(PAYMENTS_ENDPOINTS.detail(paymentId)).pipe(
      catchError((error) => this.handleError(`Failed to fetch payment ${paymentId}`, error))
    );
  }

  create(payload: PaymentCreatePayload): Observable<PaymentRead> {
    this.logger.debug('Creating payment', payload);

    return this.apiService.post<PaymentRead>(PAYMENTS_ENDPOINTS.create(), payload).pipe(
      catchError((error) => this.handleError('Failed to create payment', error))
    );
  }

  updateStatus(
    paymentId: string,
    payload: PaymentStatusUpdatePayload
  ): Observable<PaymentRead> {
    this.logger.debug(`Updating payment status for ${paymentId}`, payload);

    return this.apiService
      .patch<PaymentRead>(PAYMENTS_ENDPOINTS.updateStatus(paymentId), payload)
      .pipe(
        catchError((error) =>
          this.handleError(`Failed to update payment ${paymentId} status`, error)
        )
      );
  }

  recreateTurnPaymentSession(turnId: string): Observable<TurnPaymentResponse> {
    this.logger.debug(`Recreating payment session for turn ${turnId}`);

    return this.apiService
      .post<TurnPaymentResponse>(PAYMENTS_ENDPOINTS.recreateTurnSession(), {
        turn_id: turnId,
      })
      .pipe(
        catchError((error) =>
          this.handleError(
            `Failed to recreate payment session for turn ${turnId}`,
            error
          )
        )
      );
  }

  delete(paymentId: string): Observable<void> {
    return this.apiService.delete<void>(PAYMENTS_ENDPOINTS.delete(paymentId)).pipe(
      catchError((error) => this.handleError(`Failed to delete payment ${paymentId}`, error))
    );
  }

  private normalizeParams(
    params?: QueryParamsInput
  ): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    if (params instanceof HttpParams) {
      return params;
    }

    const normalized: Record<string, string | string[]> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        normalized[key] = value.map((item) => String(item));
        return;
      }

      normalized[key] = String(value);
    });

    return new HttpParams({ fromObject: normalized });
  }

  private handleError(context: string, error: unknown): Observable<never> {
    this.logger.error(context, error);

    if (error instanceof HttpErrorResponse) {
      const detail =
        (typeof error.error === 'object' && error.error && 'detail' in error.error
          ? (error.error as { detail?: string }).detail
          : undefined) ?? error.message ?? context;

      return throwError(() => new Error(detail));
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error(context));
  }
}
