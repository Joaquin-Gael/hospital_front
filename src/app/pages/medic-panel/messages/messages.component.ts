import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../../services/chat/chat.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ChatResponse, MessageResponse, DoctorResponse, WebSocketMessage } from '../../../services/interfaces/chat.interfaces';
import { DoctorMeResponse } from '../../../services/interfaces/doctor.interfaces';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);
  private readonly doctorService = inject(DoctorService);

  chats: ChatResponse[] = [];
  filteredChats: ChatResponse[] = [];
  selectedChat: ChatResponse | null = null;
  messages: MessageResponse[] = [];
  newMessage = '';
  searchTerm = '';
  onlineStatus: { [doctorId: string]: boolean } = {};
  currentDoctorId: string | null = null;
  lastViewed: { [chatId: string]: string } = {};

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const token = this.storageService.getAccessToken();
    if (!token) {
      this.logger.info('No auth token found, redirecting to /login');
      window.location.href = '/login';
      return;
    }

    // Obtener el ID del doctor autenticado
    this.doctorService.getMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (doctor: DoctorMeResponse) => {
        this.currentDoctorId = doctor.doc.id;
        this.loadChats();
      },
      error: (err) => {
        this.logger.error('Failed to fetch authenticated doctor', err);
        window.location.href = '/login';
      },
    });
  }

  /**
   * Carga los chats del médico autenticado.
   */
  private loadChats(): void {
    this.chatService.getChats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (chats) => {
        this.chats = chats;
        this.filteredChats = [...chats];
        this.logger.info('Chats loaded', { count: chats.length });
      },
      error: (err) => {
        this.logger.error('Failed to load chats', err);
      },
    });
  }

  /**
   * Selecciona un chat y conecta al WebSocket.
   * @param chat Chat seleccionado.
   */
  selectChat(chat: ChatResponse): void {
    if (this.selectedChat?.id !== chat.id) {
      this.chatService.disconnect(); // Desconectar WebSocket anterior
    }

    this.selectedChat = chat;
    this.messages = chat.messages || [];
    this.newMessage = '';
    this.lastViewed[chat.id] = new Date().toISOString(); // Marcar como visto

    // Conectar al WebSocket
    this.chatService.connectToChat(chat.id).then(() => {
      this.chatService.onMessage().pipe(takeUntil(this.destroy$)).subscribe({
        next: (msg: WebSocketMessage) => {
          if (msg.type === 'message' && msg.message) {
            if (msg.message.chat?.id === this.selectedChat?.id) {
              this.messages = [...this.messages, msg.message];
              this.lastViewed[chat.id] = new Date().toISOString(); // Actualizar última visualización
            }
            this.updateChatMessages(msg.message);
          } else if (msg.type === 'presence' && msg.user) {
            this.onlineStatus[msg.user] = msg.status === 'online';
          }
        },
        error: (err) => {
          this.logger.error('WebSocket message error', err);
        },
      });
    }).catch((err) => {
      this.logger.error('Failed to connect to WebSocket', err);
    });
  }

  /**
   * Actualiza los mensajes en la lista de chats.
   * @param message Nuevo mensaje recibido.
   */
  private updateChatMessages(message: MessageResponse): void {
    this.chats = this.chats.map((chat) => {
      if (chat.id === message.chat?.id) {
        return {
          ...chat,
          messages: [...(chat.messages || []), message],
        };
      }
      return chat;
    });
    this.filteredChats = [...this.chats];
  }

  /**
   * Envía un nuevo mensaje a través del WebSocket.
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedChat) return;

    this.chatService.sendMessage(this.selectedChat.id, this.newMessage);
    this.newMessage = '';
  }

  /**
   * Filtra los chats según el término de búsqueda.
   * @param event Evento del input de búsqueda.
   */
  searchChats(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();

    this.filteredChats = this.chats.filter((chat) => {
      const doc = chat.doc_1?.id === this.currentDoctorId ? chat.doc_2 : chat.doc_1;
      const name = `${doc?.first_name || ''} ${doc?.last_name || ''}`.toLowerCase();
      const lastMessage = chat.messages?.[chat.messages.length - 1]?.content.toLowerCase() || '';
      return name.includes(this.searchTerm) || lastMessage.includes(this.searchTerm);
    });
  }

  /**
   * Formatea la fecha para mostrar en la UI.
   * @param date Fecha en formato ISO.
   * @returns String con el formato de fecha.
   */
  getTimeString(date: string): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  /**
   * Obtiene el participante del chat (el otro médico).
   * @param chat Chat actual.
   * @returns DoctorResponse del participante.
   */
  getParticipant(chat: ChatResponse): DoctorResponse | undefined {
    return chat.doc_1?.id === this.currentDoctorId ? chat.doc_2 : chat.doc_1;
  }

  /**
   * Genera las iniciales del nombre y apellido del médico.
   * @param firstName Nombre del médico.
   * @param lastName Apellido del médico.
   * @returns Iniciales en formato string.
   */
  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  /**
   * Cuenta los mensajes no leídos en un chat.
   * @param chat Chat actual.
   * @returns Número de mensajes no leídos.
   */
  unreadCount(chat: ChatResponse): number {
    const lastViewedTime = this.lastViewed[chat.id] || '1970-01-01T00:00:00Z';
    return chat.messages?.filter(msg => new Date(msg.created_at) > new Date(lastViewedTime)).length || 0;
  }

  /**
   * Crea un nuevo chat con otro médico.
   */
  createNewChat(): void {
    const doc2Id = prompt('Introduce el ID del médico (UUID):');
    if (doc2Id) {
      this.chatService.createChat(doc2Id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadChats();
          this.logger.info('New chat created', { doc2Id });
        },
        error: (err) => this.logger.error('Failed to create chat', err),
      });
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}