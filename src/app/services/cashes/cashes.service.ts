import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { CASHES_ENDPOINTS } from './cashes-endpoints';
import {
  CashesDetailsRead,
  CashesPaymentSuccessPayload,
  CashesRead,
} from '../interfaces/cashes.interfaces';

type QueryValue = string | number | boolean | Array<string | number | boolean>;

type QueryParamsInput =
  | HttpParams
  | Record<string, QueryValue | null | undefined>;

@Injectable({
  providedIn: 'root',
})
export class CashesService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);

  getCashes(params?: QueryParamsInput): Observable<CashesRead[]> {
    const httpParams = this.normalizeParams(params);

    return this.apiService
      .get<CashesRead[]>(CASHES_ENDPOINTS.list(), { params: httpParams })
      .pipe(
        map((response) => response ?? []),
        catchError((error) => this.handleError('Failed to fetch cashes', error))
      );
  }

  createOrUpdateCash(
    cash: Partial<CashesDetailsRead> & { id?: string }
  ): Observable<CashesDetailsRead> {
    const { id, ...payload } = cash;
    const isUpdate = Boolean(id);
    const endpoint = isUpdate
      ? CASHES_ENDPOINTS.update(id as string)
      : CASHES_ENDPOINTS.create();

    this.logger.debug(
      `${isUpdate ? 'Updating' : 'Creating'} cash record`,
      payload
    );

    const request$ = isUpdate
      ? this.apiService.put<CashesDetailsRead>(endpoint, payload)
      : this.apiService.post<CashesDetailsRead>(endpoint, payload);

    return request$.pipe(
      catchError((error) =>
        this.handleError(
          isUpdate ? 'Failed to update cash record' : 'Failed to create cash record',
          error
        )
      )
    );
  }

  parseSuccessCallback(params: HttpParams): CashesPaymentSuccessPayload {
    const rawParams: Record<string, string> = {};
    params.keys().forEach((key) => {
      const value = params.get(key);
      if (value !== null) {
        rawParams[key] = value;
      }
    });

    const payload: CashesPaymentSuccessPayload = {
      paymentIntent: rawParams['payment_intent'],
      paymentIntentClientSecret: rawParams['payment_intent_client_secret'],
      redirectStatus: rawParams['redirect_status'],
      sessionId: rawParams['session_id'],
      cashId: rawParams['cash_id'],
      turnId: rawParams['turn_id'],
      appointmentId: rawParams['appointment_id'],
      rawParams,
    };

    const rawMetadata = rawParams['metadata'];
    if (rawMetadata) {
      try {
        payload.metadata = JSON.parse(rawMetadata);
      } catch (error) {
        this.logger.warn(
          'Unable to parse metadata from cashes success callback',
          error
        );
      }
    }

    this.logger.debug('Parsed Stripe success callback payload', payload);

    return payload;
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
