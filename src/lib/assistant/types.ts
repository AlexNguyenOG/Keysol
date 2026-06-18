export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequest {
  message: string;
  history?: AssistantMessage[];
}

export interface AssistantResponse {
  reply: string;
  source: "local" | "openai";
}
