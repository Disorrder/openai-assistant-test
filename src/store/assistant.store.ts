import { create } from "zustand";

export interface SendingMessage {
  threadId: string;
  message: string;
}

interface AssistantState {
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;

  sendingMessages: SendingMessage[];
  addSendingMessage: (message: SendingMessage) => void;
  removeSendingMessage: (threadId: string) => void;
}

export const useAssistantStore = create<AssistantState>()((set) => ({
  selectedThreadId: null,
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),

  sendingMessages: [],
  addSendingMessage: (message) =>
    set((state) => ({ sendingMessages: [...state.sendingMessages, message] })),
  removeSendingMessage: (threadId) =>
    set((state) => ({
      sendingMessages: state.sendingMessages.filter(
        (message) => message.threadId !== threadId,
      ),
    })),
}));
