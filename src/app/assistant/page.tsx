"use client";

import { Button, Textarea } from "@nextui-org/react";
import { IconSend } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "~/api/api";
import { useAssistantStore } from "~/store/assistant.store";
import type {
  CreateMessageDTO,
  Message,
  MessagesListDTO,
  Thread,
} from "~/types/assistant.types";
import { cn } from "~/utils/cn";

export default function AssistantPage() {
  const queryClient = useQueryClient();
  const {
    selectedThreadId,
    setSelectedThreadId,
    sendingMessages,
    addSendingMessage,
    removeSendingMessage,
  } = useAssistantStore();

  const messagesQuery = useQuery({
    queryKey: ["messages", selectedThreadId],
    async queryFn() {
      if (!selectedThreadId) return { data: [] };
      const res = await api.get<MessagesListDTO>(
        `/assistant/threads/${selectedThreadId}/messages`,
      );
      return res.data;
    },
  });

  const messagesList = messagesQuery.data;
  const messages = messagesList?.data;
  console.log("🚀 ~ AssistantPage ~ messages:", messages);

  const sendMessageMutation = useMutation({
    mutationFn: (dto: CreateMessageDTO) =>
      api
        .post<Message>(`/assistant/threads/${selectedThreadId}/messages`, dto)
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedThreadId],
      });
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: () =>
      api.post<Thread>("/assistant/threads").then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      return data;
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesQuery is not exhaustive
  useEffect(() => {
    messagesQuery.refetch();
  }, [selectedThreadId]);

  const [input, setInput] = useState("");

  function handleSendMessage() {
    const formattedInput = input.trim();
    if (!formattedInput) return;

    if (!selectedThreadId) {
      createThreadMutation.mutate(void 0, {
        onSuccess: (thread) => {
          setSelectedThreadId(thread.id);
        },
      });
    }

    sendMessageMutation.mutate({ input });
    setInput("");
  }

  return (
    <div className="flex max-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col-reverse justify-start gap-4 overflow-y-auto p-4">
        {messages?.length ? (
          messages.map((message) => (
            <AssistantChatMessage key={message.id} message={message} />
          ))
        ) : (
          <div>No messages</div>
        )}
      </div>
      <div className="border-gray-700 border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage}>
            <IconSend size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssistantChatMessage({ message }: { message: Message }) {
  console.log("🚀 ~ AssistantChatMessage ~ message:", message);
  const textContent = message.content.find(
    (content) => content.type === "text",
  );

  return (
    <div
      className={cn(
        "rounded-lg p-2",
        message.role === "user" ? "ml-auto bg-blue-600" : "bg-gray-700",
      )}
    >
      {textContent?.text.value}
    </div>
  );
}
