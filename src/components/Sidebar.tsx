"use client";

import { Button, Skeleton } from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/api/api";
import { useAssistantStore } from "~/store/assistant.store";
import type { Thread } from "~/types/assistant.types";
import { cn } from "~/utils/cn";

export default function Sidebar() {
  const {
    selectedThreadId: selectedThread,
    setSelectedThreadId: setSelectedThread,
  } = useAssistantStore();
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const res = await api.get<Thread[]>("/assistant/threads");
      return res.data;
    },
  });
  const threads = threadsQuery.data;
  const showThreads = !threadsQuery.isLoading && threadsQuery.data;

  const threadMutation = useMutation({
    mutationFn: (thread: Thread) =>
      api.patch<Thread>(`/threads/${thread.id}`, thread),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  function handleCreateThread() {
    setSelectedThread(null);
  }

  return (
    <div className="w-64 bg-gray-800 p-4">
      <Button onPress={handleCreateThread} className="mb-4 w-full">
        Create new thread
      </Button>
      <div className="space-y-2">
        {showThreads && threads
          ? threads.map((thread) => (
              <Button
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className={cn(
                  "w-full justify-start",
                  !thread.title && "text-gray-400",
                  selectedThread === thread.id ? "bg-blue-600" : "bg-gray-700",
                )}
              >
                {thread.title || "Untitled thread"}
              </Button>
            ))
          : Array.from({ length: 3 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Skeleton className="h-10 w-full" key={index} />
            ))}
      </div>
    </div>
  );
}
