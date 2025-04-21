import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface Message {
  id: string
  sender: {
    id: string
    name: string
    avatar: string
    isOnline: boolean
  }
  content: string
  timestamp: Date
  isRead: boolean
}

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    avatar: string
    isOnline: boolean
    role: string
  }
  lastMessage: {
    content: string
    timestamp: Date
    isRead: boolean
  }
  unreadCount: number
}

@Component({
  selector: "app-messages",
  templateUrl: "./messages.component.html",
  styleUrls: ["./messages.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MessagesComponent implements OnInit {
  conversations: Conversation[] = []
  filteredConversations: Conversation[] = []
  selectedConversation: Conversation | null = null
  messages: Message[] = []
  newMessage = ""
  searchTerm = ""

  constructor() {}

  ngOnInit(): void {
    this.loadConversations()
    this.filteredConversations = [...this.conversations]
  }

  loadConversations(): void {
    this.conversations = [
      {
        id: "conv1",
        participant: {
          id: "user1",
          name: "Dr. Juan Pérez",
          avatar: "assets/images/avatar-1.jpg",
          isOnline: true,
          role: "Cardiólogo",
        },
        lastMessage: {
          content: "¿Podemos revisar el caso del paciente García?",
          timestamp: new Date(2023, 3, 15, 14, 30),
          isRead: false,
        },
        unreadCount: 2,
      },
      {
        id: "conv2",
        participant: {
          id: "user2",
          name: "Dra. Laura Sánchez",
          avatar: "assets/images/avatar-2.jpg",
          isOnline: false,
          role: "Pediatra",
        },
        lastMessage: {
          content: "Te envié los resultados de laboratorio",
          timestamp: new Date(2023, 3, 14, 10, 15),
          isRead: true,
        },
        unreadCount: 0,
      },
      {
        id: "conv3",
        participant: {
          id: "user3",
          name: "Carlos Rodríguez",
          avatar: "assets/images/avatar-3.jpg",
          isOnline: true,
          role: "Paciente",
        },
        lastMessage: {
          content: "Doctora, tengo una duda sobre mi medicación",
          timestamp: new Date(2023, 3, 15, 9, 45),
          isRead: false,
        },
        unreadCount: 1,
      },
      {
        id: "conv4",
        participant: {
          id: "user4",
          name: "María López",
          avatar: "assets/images/avatar-4.jpg",
          isOnline: false,
          role: "Paciente",
        },
        lastMessage: {
          content: "Gracias por la consulta de hoy",
          timestamp: new Date(2023, 3, 13, 16, 20),
          isRead: true,
        },
        unreadCount: 0,
      },
      {
        id: "conv5",
        participant: {
          id: "user5",
          name: "Dr. Roberto Gómez",
          avatar: "assets/images/avatar-5.jpg",
          isOnline: true,
          role: "Neurólogo",
        },
        lastMessage: {
          content: "¿Tienes disponibilidad para una interconsulta?",
          timestamp: new Date(2023, 3, 15, 11, 5),
          isRead: false,
        },
        unreadCount: 3,
      },
    ]
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation
    this.loadMessages(conversation.id)

    // Marcar como leídos
    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0
      conversation.lastMessage.isRead = true
    }
  }

  loadMessages(conversationId: string): void {
    // Simulación de carga de mensajes
    this.messages = [
      {
        id: "msg1",
        sender: {
          id: this.selectedConversation?.participant.id || "",
          name: this.selectedConversation?.participant.name || "",
          avatar: this.selectedConversation?.participant.avatar || "",
          isOnline: this.selectedConversation?.participant.isOnline || false,
        },
        content: "Hola doctora, ¿cómo estás?",
        timestamp: new Date(2023, 3, 15, 9, 30),
        isRead: true,
      },
      {
        id: "msg2",
        sender: {
          id: "me",
          name: "Dra. Ana Martínez",
          avatar: "assets/images/doctor-avatar.jpg",
          isOnline: true,
        },
        content: "Hola, muy bien gracias. ¿En qué puedo ayudarte?",
        timestamp: new Date(2023, 3, 15, 9, 32),
        isRead: true,
      },
      {
        id: "msg3",
        sender: {
          id: this.selectedConversation?.participant.id || "",
          name: this.selectedConversation?.participant.name || "",
          avatar: this.selectedConversation?.participant.avatar || "",
          isOnline: this.selectedConversation?.participant.isOnline || false,
        },
        content: "Tengo una duda sobre mi medicación. ¿Debo tomarla con las comidas o en ayunas?",
        timestamp: new Date(2023, 3, 15, 9, 35),
        isRead: true,
      },
      {
        id: "msg4",
        sender: {
          id: "me",
          name: "Dra. Ana Martínez",
          avatar: "assets/images/doctor-avatar.jpg",
          isOnline: true,
        },
        content:
          "Es mejor que la tomes después de las comidas para evitar molestias gástricas. ¿Has notado algún efecto secundario?",
        timestamp: new Date(2023, 3, 15, 9, 40),
        isRead: true,
      },
      {
        id: "msg5",
        sender: {
          id: this.selectedConversation?.participant.id || "",
          name: this.selectedConversation?.participant.name || "",
          avatar: this.selectedConversation?.participant.avatar || "",
          isOnline: this.selectedConversation?.participant.isOnline || false,
        },
        content: "No, ninguno hasta ahora. Gracias por la aclaración.",
        timestamp: new Date(2023, 3, 15, 9, 45),
        isRead: false,
      },
    ]
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return

    // Crear nuevo mensaje
    const newMsg: Message = {
      id: `msg${this.messages.length + 1}`,
      sender: {
        id: "me",
        name: "Dra. Ana Martínez",
        avatar: "assets/images/doctor-avatar.jpg",
        isOnline: true,
      },
      content: this.newMessage,
      timestamp: new Date(),
      isRead: true,
    }

    // Añadir a la lista de mensajes
    this.messages.push(newMsg)

    // Actualizar última conversación
    this.selectedConversation.lastMessage = {
      content: this.newMessage,
      timestamp: new Date(),
      isRead: true,
    }

    // Limpiar campo de mensaje
    this.newMessage = ""

    // Simular respuesta (en un caso real esto vendría del backend)
    setTimeout(() => {
      if (this.selectedConversation) {
        const replyMsg: Message = {
          id: `msg${this.messages.length + 1}`,
          sender: {
            id: this.selectedConversation.participant.id,
            name: this.selectedConversation.participant.name,
            avatar: this.selectedConversation.participant.avatar,
            isOnline: this.selectedConversation.participant.isOnline,
          },
          content: "Gracias por la información, doctora.",
          timestamp: new Date(),
          isRead: false,
        }

        this.messages.push(replyMsg)

        // Actualizar última conversación
        this.selectedConversation.lastMessage = {
          content: replyMsg.content,
          timestamp: new Date(),
          isRead: false,
        }
        this.selectedConversation.unreadCount = 0 // Ya estamos viendo la conversación
      }
    }, 2000)
  }

  searchConversations(event: Event): void {
    const target = event.target as HTMLInputElement
    this.searchTerm = target.value.toLowerCase()

    this.filteredConversations = this.conversations.filter(
      (conv) =>
        conv.participant.name.toLowerCase().includes(this.searchTerm) ||
        conv.participant.role.toLowerCase().includes(this.searchTerm) ||
        conv.lastMessage.content.toLowerCase().includes(this.searchTerm),
    )
  }

  getTimeString(date: Date): string {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString()
    }
  }
}
