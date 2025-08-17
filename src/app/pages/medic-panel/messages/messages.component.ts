import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../../services/chat/chat.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ChatResponse, MessageResponse, DoctorResponse, WebSocketMessage } from '../../../services/interfaces/chat.interfaces';
import { DoctorMeResponse, Doctor } from '../../../services/interfaces/doctor.interfaces';

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
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  chats: ChatResponse[] = [];
  filteredChats: ChatResponse[] = [];
  selectedChat: ChatResponse | null = null;
  messages: MessageResponse[] = [];
  newMessage = '';
  searchTerm = '';
  onlineStatus: { [doctorId: string]: boolean } = {};
  currentDoctorId: string | null = null;
  lastViewed: { [chatId: string]: string } = {};
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  showNewChatModal = false;
  doctorSearchTerm = '';

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  private readonly destroy$ = new Subject<void>();
  private readonly LAST_VIEWED_KEY = 'last_viewed_chats';

  ngOnInit(): void {
    const token = this.storageService.getAccessToken();
    if (!token) {
      this.logger.info('No auth token found, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    const storedLastViewed = this.storageService.getItem(this.LAST_VIEWED_KEY);
    if (storedLastViewed) {
      this.lastViewed = JSON.parse(storedLastViewed);
    }

    this.doctorService.getMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (doctor: DoctorMeResponse) => {
        this.currentDoctorId = doctor.doc.id;
        this.loadChats();
        this.loadDoctors();
      },
      error: (err: Error) => {
        this.logger.error('Failed to fetch authenticated doctor', { error: err.message });
        this.router.navigate(['/login']);
      },
    });
  }

  private loadChats(): void {
    this.chatService.getChats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (chats) => {
        this.chats = chats;
        this.filteredChats = [...chats];
        this.logger.info('Chats loaded', { count: chats.length });
        this.connectWebSockets();
      },
      error: (err: Error) => {
        this.logger.error('Failed to load chats', { error: err.message });
      },
    });
  }

  private loadDoctors(): void {
    this.doctorService.getDoctors().pipe(takeUntil(this.destroy$)).subscribe({
      next: (doctors) => {
        this.doctors = doctors.filter(doc => doc.id !== this.currentDoctorId);
        this.filteredDoctors = [...this.doctors];
        this.logger.info('Doctors loaded for new chat', { count: this.doctors.length });
      },
      error: (err: Error) => {
        this.logger.error('Failed to load doctors', { error: err.message });
      },
    });
  }

  private connectWebSockets(): void {
    this.chats.forEach(chat => {
      this.chatService.connectToChat(chat.id).then(() => {
        this.logger.info('Connected to WebSocket for chat', { chatId: chat.id });
      }).catch(err => {
        this.logger.error('Failed to connect to WebSocket for chat', { chatId: chat.id, error: err });
      });
    });

    this.chatService.onMessage().pipe(takeUntil(this.destroy$)).subscribe({
      next: (msg: WebSocketMessage) => {
        if (msg.type === 'message' && msg.message) {
          this.handleNewMessage(msg.message);
        } else if (msg.type === 'presence' && msg.user) {
          this.onlineStatus[msg.user] = msg.status === 'online';
          this.cdr.detectChanges();
        }
      },
      error: (err: Error) => {
        this.logger.error('WebSocket message error', { error: err.message });
      },
    });
  }

  private handleNewMessage(message: MessageResponse): void {
    if (!message.chat?.id) {
      this.logger.warn('Received message with undefined chat', { message });
      return;
    }

    if (message.chat.id === this.selectedChat?.id) {
      if (!this.messages.find(msg => msg.id === message.id)) {
        this.messages = [...this.messages, message];
        this.lastViewed[message.chat.id] = new Date().toISOString();
        this.storageService.setItem(this.LAST_VIEWED_KEY, JSON.stringify(this.lastViewed));
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    }

    this.chats = this.chats.map((chat) => {
      if (chat.id === message.chat?.id) {
        if (!chat.messages?.find(msg => msg.id === message.id)) {
          return {
            ...chat,
            messages: [...(chat.messages || []), message],
          };
        }
      }
      return chat;
    });
    this.filteredChats = [...this.chats];
    this.cdr.detectChanges();
  }

  selectChat(chat: ChatResponse): void {
    if (this.selectedChat?.id !== chat.id) {
      this.chatService.disconnect();
      this.chatService.connectToChat(chat.id).then(() => {
        this.logger.info('Reconnected WebSocket for selected chat', { chatId: chat.id });
      }).catch(err => {
        this.logger.error('Failed to reconnect WebSocket', { error: err });
      });
    }

    this.selectedChat = chat;
    this.messages = chat.messages || [];
    this.newMessage = '';
    this.lastViewed[chat.id] = new Date().toISOString();
    this.storageService.setItem(this.LAST_VIEWED_KEY, JSON.stringify(this.lastViewed));
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedChat) return;

    const tempMessage: MessageResponse = {
      id: 'temp-' + Date.now(),
      content: this.newMessage,
      created_at: new Date().toISOString(),
      sender: { id: this.currentDoctorId || '' } as DoctorResponse,
      chat: this.selectedChat,
    };
    this.messages = [...this.messages, tempMessage];
    this.updateChatMessages(tempMessage);
    this.cdr.detectChanges();
    this.scrollToBottom();

    this.chatService.sendMessage(this.selectedChat.id, this.newMessage);
    this.newMessage = '';
  }

  private updateChatMessages(message: MessageResponse): void {
    if (!message.chat?.id) {
      this.logger.warn('Attempted to update chat with undefined chat', { message });
      return;
    }

    this.chats = this.chats.map((chat) => {
      if (chat.id === message.chat?.id) {
        if (!chat.messages?.find(msg => msg.id === message.id)) {
          return {
            ...chat,
            messages: [...(chat.messages || []), message],
          };
        }
      }
      return chat;
    });
    this.filteredChats = [...this.chats];
    this.cdr.detectChanges();
  }

  private matchesSearch(term: string, name: string, extra?: string): boolean {
    return name.toLowerCase().includes(term) || (extra?.toLowerCase().includes(term) ?? false);
  }

  searchChats(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;

    this.searchTerm = target.value.toLowerCase();
    this.filteredChats = this.chats.filter((chat) => {
      const doc = this.getParticipant(chat);
      const name = `${doc?.first_name || ''} ${doc?.last_name || ''}`;
      const lastMessage = chat.messages?.[chat.messages.length - 1]?.content || '';
      return this.matchesSearch(this.searchTerm, name, lastMessage);
    });
    this.cdr.detectChanges();
  }

  searchDoctors(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;

    this.doctorSearchTerm = target.value.toLowerCase();
    this.filteredDoctors = this.doctors.filter(doc => {
      const name = `${doc.first_name || ''} ${doc.last_name || ''}`;
      return this.matchesSearch(this.doctorSearchTerm, name, doc.username);
    });
    this.cdr.detectChanges();
  }

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

  getParticipant(chat: ChatResponse): DoctorResponse | undefined {
    return chat.doc_1?.id === this.currentDoctorId ? chat.doc_2 : chat.doc_1;
  }

  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  unreadCount(chat: ChatResponse): number {
    const lastViewedTime = this.lastViewed[chat.id] || '1970-01-01T00:00:00Z';
    return chat.messages?.filter(msg => new Date(msg.created_at) > new Date(lastViewedTime) && msg.sender?.id !== this.currentDoctorId).length || 0;
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const prevDate = new Date(this.messages[index - 1].created_at).toDateString();
    const currDate = new Date(this.messages[index].created_at).toDateString();
    return prevDate !== currDate;
  }

  getAvatarBackground(doctorId: string | undefined): string {
    if (!doctorId) return 'linear-gradient(135deg, #FF6B6B, #FF8E8E)';
    const colors = [
      'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
      'linear-gradient(135deg, #4ECDC4, #6EDDD6)',
      'linear-gradient(135deg, #45B7D1, #67C3DB)',
      'linear-gradient(135deg, #96CEB4, #A8D5C4)',
      'linear-gradient(135deg, #FFEEAD, #FFF2C7)',
    ];
    const hash = doctorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  openNewChatModal(): void {
    this.showNewChatModal = true;
    this.filteredDoctors = [...this.doctors];
    this.cdr.detectChanges();
  }

  closeNewChatModal(): void {
    this.showNewChatModal = false;
    this.doctorSearchTerm = '';
    this.cdr.detectChanges();
  }

  createChatWithDoctor(doctorId: string): void {
    this.chatService.createChat(doctorId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadChats();
        this.closeNewChatModal();
        this.logger.info('New chat created', { doctorId });
      },
      error: (err: Error) => this.logger.error('Failed to create chat', { error: err.message }),
    });
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}