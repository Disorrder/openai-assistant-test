import { cn } from "@nextui-org/react";
import type { Message } from "~/types/assistant.types";

export default function AssistantChatMessage({
  message,
}: { message: Message }) {
  const textContent = message.content.find(
    (content) => content.type === "text",
  );

  const isUser = message.role === "user";
  const time = new Date(message.created_at * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "rounded-lg p-2",
          isUser ? "ml-auto bg-blue-600" : "mr-auto min-w-[66%] bg-gray-700",
        )}
      >
        {textContent?.text.value}
      </div>
      <div className="mt-2 flex-0 self-start text-gray-500 text-xs leading-6">
        {time}
      </div>
    </div>
  );
}
