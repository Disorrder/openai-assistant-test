import { cn } from "@nextui-org/react";
import type { Message, Thread } from "~/types/assistant.types";

export default function AssistantChatMessage({
  message,
}: { message: Message }) {
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

export const defaultThread: Thread = {
  id: "",
  title: "New thread",
  CreatedAt: Date.now(),
};

export function getIntroMessage(thread = defaultThread): Message {
  console.log("🚀 ~ getIntroMessage ~ thread:", thread);
  return {
    id: "intro",
    object: "thread.message",
    role: "assistant",
    thread_id: thread.id,
    created_at: thread.CreatedAt,
    content: [
      {
        type: "text",
        text: {
          value:
            "Hello! Got questions? I’m your go-to for quick answers and solutions about our products and services.",
          annotations: [],
        },
      },
    ],
  };
}
