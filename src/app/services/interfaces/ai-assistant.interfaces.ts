export type AIAssistantRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIAssistantMetadata {
  conversationId?: string;
  workflowId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface AIAssistantMessage {
  id?: string;
  role: AIAssistantRole;
  content: string;
  createdAt?: string;
  metadata?: AIAssistantMetadata;
}

export interface AISuggestion {
  id?: string;
  title: string;
  prompt: string;
  description?: string;
  icon?: string;
  metadata?: AIAssistantMetadata;
}

export interface AIAssistantRequest {
  message: string;
  conversation_id?: string;
  extra_context?: Record<string, unknown>;
  metadata?: AIAssistantMetadata;
}

export interface AISuggestionRequest {
  conversation_id?: string;
  message?: string;
  metadata?: AIAssistantMetadata;
}

export interface AIWorkflowRequest {
  workflow: string;
  input?: Record<string, unknown>;
  conversation_id?: string;
  metadata?: AIAssistantMetadata;
}

export type AIWorkflowStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AIWorkflowStep {
  id?: string;
  name?: string;
  description?: string;
  status: AIWorkflowStatus;
  output?: Record<string, unknown>;
  metadata?: AIAssistantMetadata;
}

export interface AIAssistantResponse {
  conversationId?: string;
  messages: AIAssistantMessage[];
  suggestions?: AISuggestion[];
  metadata?: AIAssistantMetadata;
}

export interface AISuggestionResponse {
  conversationId?: string;
  suggestions: AISuggestion[];
  metadata?: AIAssistantMetadata;
}

export interface AIWorkflowResponse {
  workflow: string;
  status: AIWorkflowStatus;
  steps: AIWorkflowStep[];
  result?: Record<string, unknown>;
  metadata?: AIAssistantMetadata;
}
