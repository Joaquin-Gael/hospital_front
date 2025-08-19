import { Injectable, inject } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { CHAT_ENDPOINTS } from './chat.endpoints';
import { ChatResponse, MessageResponse, WebSocketMessage } from '../interfaces/chat.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);

  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();

  getChats(): Observable<ChatResponse[]> {
    return this.apiService.get<ChatResponse[]>(CHAT_ENDPOINTS.GET_CHATS()).pipe(
      tap((chats) => this.logger.info('Chats loaded successfully', { count: chats.length })),
      catchError((error) => this.handleError(error, 'Failed to load chats'))
    );
  }

  createChat(doc2Id: string): Observable<{ message: string }> {
    const params = new HttpParams().set('doc_2_id', doc2Id);
    return this.apiService
      .post<{ message: string }>(CHAT_ENDPOINTS.CREATE_CHAT(), {}, { params })
      .pipe(
        tap((response) => this.logger.info('Chat created', { response: response.message })),
        catchError((error) => this.handleError(error, 'Failed to create chat'))
      );
  }

  async connectToChat(chatId: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.logger.warn('WebSocket already connected');
      return;
    }

    const token = `Bearer_${this.storageService.getAccessToken()}`;
    if (!token) {
      this.logger.error('No auth token found');
      throw new Error('No authentication token available');
    }

    // Usamos buildWsUrl del ApiService para construir la URL del WebSocket
    const wsUrl$ = this.apiService.buildWsUrl(CHAT_ENDPOINTS.WEBSOCKET(chatId)).pipe(
      map((wsUrl) => `${wsUrl}?token=${token}`)
    );

    return new Promise((resolve, reject) => {
      wsUrl$.subscribe({
        next: (wsUrl) => {
          this.logger.info('Constructed WebSocket URL', { wsUrl });
          this.socket = new WebSocket(wsUrl);

          this.socket.onopen = () => {
            this.logger.info('WebSocket connected', { chatId });
            resolve();
          };

          this.socket.onmessage = (event) => {
            try {
              const data: WebSocketMessage = JSON.parse(event.data);
              this.messageSubject.next(data);
            } catch (error) {
              this.logger.error('Failed to parse WebSocket message', error);
            }
          };

          this.socket.onclose = (event) => {
            this.logger.info('WebSocket disconnected', { code: event.code, reason: event.reason });
            this.socket = null;
          };

          this.socket.onerror = (error) => {
            this.logger.error('WebSocket error', error);
            this.messageSubject.error(error);
            reject(error);
          };
        },
        error: (err) => {
          this.logger.error('Failed to construct WebSocket URL', err);
          reject(err);
        },
      });
    });
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    await this.connectToChat(chatId)
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.logger.error('WebSocket not connected');
      throw new Error('WebSocket is not connected');
    }

    const message = { content };
    this.socket.send(JSON.stringify(message));
    this.logger.info('Message sent', { chatId, content });
  }

  onMessage(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
      this.logger.info('WebSocket disconnected manually');
    }
  }

  private handleError(error: any, context: string): Observable<never> {
    let errorMessage = context;

    if (error.status === 400) {
      errorMessage = 'Solicitud inválida. Verifica los datos enviados.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
      this.storageService.clearStorage();
      window.location.href = '/login';
    } else if (error.status === 403) {
      errorMessage = 'Acceso denegado. No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      errorMessage = 'Chat o recurso no encontrado.';
    } else if (error.status >= 500) {
      errorMessage = 'Error en el servidor. Intenta de nuevo más tarde.';
    }

    this.logger.error(context, { error: error.message || error, status: error.status });
    return throwError(() => new Error(errorMessage));
  }
}