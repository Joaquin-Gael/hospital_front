import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { AI_ASSISTANT_ENDPOINTS } from './ai-assistant-endpoints';
import {
  AIAssistantMessage,
  AIAssistantMetadata,
  AIAssistantRequest,
  AIAssistantResponse,
  AISuggestion,
} from '../interfaces/ai-assistant.interfaces';

interface RawAIAssistantMessage extends Partial<AIAssistantMessage> {
  role?: string;
  created_at?: string;
  metadata?: AIAssistantMetadata | null;
}

interface RawAIAssistantSuggestion extends Partial<AISuggestion> {
  metadata?: AIAssistantMetadata | null;
}

interface RawAIAssistantResponse extends Partial<AIAssistantResponse> {
  conversation_id?: string;
  messages?: RawAIAssistantMessage[] | null;
  suggestions?: RawAIAssistantSuggestion[] | null;
  metadata?: AIAssistantMetadata | null;
}

@Injectable({
  providedIn: 'root',
})
export class AIAssistantService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);

  chat(request: string, extraContext: Record<string, unknown> = {}): Observable<AIAssistantResponse> {
    const payload: AIAssistantRequest = {
      message: request,
    };

    if (Object.keys(extraContext).length > 0) {
      payload.extra_context = extraContext;
    }

    return this.apiService.post<RawAIAssistantResponse>(AI_ASSISTANT_ENDPOINTS.CHAT(), payload).pipe(
      map((response) => this.mapResponse(response)),
      catchError((error) => this.handleChatError(error))
    );
  }

  private mapResponse(payload: RawAIAssistantResponse | null | undefined): AIAssistantResponse {
    const conversationId = typeof payload?.conversation_id === 'string' ? payload?.conversation_id : payload?.conversationId;
    const messages = Array.isArray(payload?.messages)
      ? payload!.messages!.map((message, index) => this.mapMessage(message, index))
      : [];
    const suggestions = Array.isArray(payload?.suggestions)
      ? payload!.suggestions!.map((suggestion, index) => this.mapSuggestion(suggestion, index))
      : undefined;

    const metadata = this.mapMetadata(payload?.metadata);

    return {
      conversationId: conversationId ?? undefined,
      messages,
      suggestions,
      metadata,
    };
  }

  private mapMessage(message: RawAIAssistantMessage | null | undefined, index: number): AIAssistantMessage {
    const role = this.toRole(message?.role);
    const content = typeof message?.content === 'string' ? message!.content : '';
    const createdAt = typeof message?.createdAt === 'string' ? message!.createdAt : message?.created_at;

    const mappedMessage: AIAssistantMessage = {
      id: typeof message?.id === 'string' ? message!.id : undefined,
      role,
      content,
      createdAt,
      metadata: this.mapMetadata(message?.metadata),
    };

    if (!content) {
      this.logger.warn('AI Assistant message missing content', { index, role });
    }

    return mappedMessage;
  }

  private mapSuggestion(suggestion: RawAIAssistantSuggestion | null | undefined, index: number): AISuggestion {
    const mappedSuggestion: AISuggestion = {
      id: typeof suggestion?.id === 'string' ? suggestion!.id : undefined,
      title: typeof suggestion?.title === 'string' ? suggestion!.title : 'Sugerencia',
      prompt: typeof suggestion?.prompt === 'string' ? suggestion!.prompt : '',
      description: typeof suggestion?.description === 'string' ? suggestion!.description : undefined,
      icon: typeof suggestion?.icon === 'string' ? suggestion!.icon : undefined,
      metadata: this.mapMetadata(suggestion?.metadata),
    };

    if (!mappedSuggestion.prompt) {
      this.logger.debug('Suggestion received without prompt', { index });
    }

    return mappedSuggestion;
  }

  private mapMetadata(metadata: AIAssistantMetadata | null | undefined): AIAssistantMetadata | undefined {
    if (!metadata) {
      return undefined;
    }

    return { ...metadata };
  }

  private toRole(role: unknown): AIAssistantMessage['role'] {
    if (role === 'system' || role === 'user' || role === 'assistant' || role === 'tool') {
      return role;
    }

    return 'assistant';
  }

  private handleChatError(error: unknown): Observable<AIAssistantResponse> {
    const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: number }).status ?? 0 : 0;

    if (status === 500 || status === 504) {
      this.logger.warn('AI Assistant service unavailable, returning fallback response', { status });
      return of(this.createFallbackResponse());
    }

    this.logger.error('AI Assistant chat request failed', error);
    return throwError(() => error);
  }

  private createFallbackResponse(): AIAssistantResponse {
    const metadata: AIAssistantMetadata = {
      isFallback: true,
    };

    return {
      messages: [
        {
          id: 'fallback',
          role: 'assistant',
          content:
            'Lo siento, el asistente inteligente no está disponible en este momento. Por favor, intenta nuevamente más tarde.',
          metadata,
        },
      ],
      metadata,
    };
  }
}
