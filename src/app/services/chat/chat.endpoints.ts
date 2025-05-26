export const CHAT_ENDPOINTS = {
  GET_CHATS: () => 'medic/chat/',
  CREATE_CHAT: () => 'medic/chat/add',
  WEBSOCKET: (chatId: string) => `/chat/ws/chat/${chatId}/`,
};