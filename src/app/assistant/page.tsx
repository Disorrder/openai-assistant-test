"use client";

import { Button, Spinner, Textarea } from "@nextui-org/react";
import { IconSend } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/api/api";
import AssistantChatMessage from "~/components/AssistantChatMessage";
import {
  createMessage,
  defaultThread,
  introMessageText,
  useAssistantStore,
} from "~/store/assistant.store";
import type {
  CreateMessageDTO,
  Message,
  MessagesListDTO,
  Thread,
} from "~/types/assistant.types";

interface CreateMessageData extends CreateMessageDTO {
  threadId: string;
}

export default function AssistantPage() {
  const queryClient = useQueryClient();
  const { selectedThreadId, setSelectedThreadId } = useAssistantStore();

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () =>
      api.get<Thread[]>("/assistant/threads").then((res) => res.data),
  });
  const threads = threadsQuery.data;
  const thread =
    threads?.find((thread) => thread.id === selectedThreadId) ?? defaultThread;

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

  const messagesList = messagesQuery.data as MessagesListDTO;
  const messages = messagesList?.data;

  const sendMessageMutation = useMutation({
    mutationFn: ({ threadId, ...dto }: CreateMessageData) =>
      api
        .post<Message>(`/assistant/threads/${threadId}/messages`, dto)
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

  const isSendingMessage =
    createThreadMutation.isPending ||
    sendMessageMutation.isPending ||
    messages?.[0]?.id === "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesQuery is not exhaustive
  useEffect(() => {
    messagesQuery.refetch();
  }, [selectedThreadId]);

  const introMessage = useMemo(() => {
    if (!thread) return;
    return createMessage({
      threadId: thread.id,
      message: introMessageText,
      role: "assistant",
    });
  }, [thread]);

  const [input, setInput] = useState("");

  async function handleSendMessage() {
    const formattedInput = input.trim();
    if (!formattedInput) return;

    setInput("");

    let threadId = selectedThreadId;
    if (!threadId) {
      const thread = await new Promise<Thread>((resolve) => {
        createThreadMutation.mutate(void 0, {
          onSuccess: (thread) => {
            setSelectedThreadId(thread.id);
            resolve(thread);
          },
        });
      });
      threadId = thread.id;
    }

    const message = createMessage({ threadId, message: formattedInput });
    queryClient.setQueryData(
      ["messages", threadId],
      (oldData?: MessagesListDTO) => {
        return {
          ...oldData,
          data: oldData ? [message, ...oldData.data] : [message],
        };
      },
    );

    await new Promise<Message>((resolve) => {
      sendMessageMutation.mutate(
        { threadId, input },
        {
          onSuccess: (message) => {
            resolve(message);
          },
        },
      );
    });
  }

  function handleCmdEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    const isCmd = e.metaKey || e.ctrlKey;
    if (e.key === "Enter" && isCmd) {
      handleSendMessage();
    }
  }

  return (
    <div className="flex max-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col-reverse justify-start gap-4 overflow-y-auto p-4">
        {!messages?.length && messagesQuery.isLoading && (
          <div className="flex justify-center p-4">
            <Spinner
              label="Loading messages..."
              color="default"
              labelColor="foreground"
            />
          </div>
        )}
        {messages?.map((message) => (
          <AssistantChatMessage key={message.id} message={message} />
        ))}
        {!messagesList?.has_more && introMessage && (
          <AssistantChatMessage message={introMessage} />
        )}
      </div>
      <div className="border-gray-700 border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            onKeyDown={handleCmdEnter}
          />
          <Button
            onClick={handleSendMessage}
            isDisabled={isSendingMessage}
            isLoading={isSendingMessage}
          >
            {!isSendingMessage && <IconSend size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
