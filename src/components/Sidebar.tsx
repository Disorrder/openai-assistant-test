"use client";

import { Button, Skeleton } from "@nextui-org/react";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MouseEvent } from "react";
import { api } from "~/api/api";
import { useAssistantStore } from "~/store/assistant.store";
import type { Thread } from "~/types/assistant.types";
import { cn } from "~/utils/cn";

export default function Sidebar() {
  const { selectedThreadId, setSelectedThreadId } = useAssistantStore();
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () =>
      api.get<Thread[]>("/assistant/threads").then((res) => res.data),
  });
  const threads = threadsQuery.data;
  const showThreads = !threadsQuery.isLoading && threadsQuery.data;

  const threadDeleteMutation = useMutation({
    mutationFn: (thread: Thread) =>
      api.delete<Thread>(`/assistant/threads/${thread.id}`).then(() => thread),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({
        queryKey: ["messages", thread.id],
      });
      if (selectedThreadId === thread.id) {
        setSelectedThreadId(null);
      }
    },
  });

  function handleCreateThread() {
    setSelectedThreadId(null);
  }

  function handleClickDelete(e: MouseEvent<HTMLButtonElement>, thread: Thread) {
    e.stopPropagation();
    threadDeleteMutation.mutate(thread);
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
                as="div"
                size="sm"
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  "group w-full justify-start pr-0",
                  !thread.title && "text-gray-400",
                  selectedThreadId === thread.id
                    ? "bg-blue-600"
                    : "bg-gray-700",
                )}
              >
                {thread.title || "Untitled thread"}
                <div className="min-w-3 flex-1" />
                <Button
                  variant="light"
                  color="danger"
                  size="sm"
                  isIconOnly
                  onClick={(e) => handleClickDelete(e, thread)}
                  className="ml-2 opacity-0 transition group-hover:opacity-100"
                >
                  <IconTrash className="size-4" />
                </Button>
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
