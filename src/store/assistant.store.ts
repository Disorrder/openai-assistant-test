import { create } from "zustand";
import type { Message, Thread } from "~/types/assistant.types";

interface AssistantState {
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
}

export const useAssistantStore = create<AssistantState>()((set) => ({
  selectedThreadId: null,
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
}));

export const defaultThread: Thread = {
  id: "",
  title: "New thread",
  CreatedAt: Date.now(),
};

export interface CreateMessageParams {
  threadId: string;
  message: string;
  role?: Message["role"];
}

export function createMessage(params: CreateMessageParams): Message {
  return {
    id: "",
    role: params.role || "user",
    object: "thread.message",
    thread_id: params.threadId,
    content: [
      {
        type: "text",
        text: {
          value: params.message,
          annotations: [],
        },
      },
    ],
    created_at: Date.now() / 1000,
  };
}

export const introMessageText =
  "Hello! Got questions? I’m your go-to for quick answers and solutions about our products and services.";
