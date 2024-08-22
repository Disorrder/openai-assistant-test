export interface Thread {
  id: string;
  title: string;
  CreatedAt: number;
}

export interface Message {
  id: string;
  object: "thread.message";
  thread_id: string;
  role: "user" | "assistant";
  content: MessageContent[];
  created_at: number;
}

export interface MessageContentText {
  type: "text";
  text: {
    value: string;
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Define the type
    annotations: any[];
  };
}
type MessageContent = MessageContentText;

export interface CreateMessageDTO {
  input: string;
}

export interface MessagesListDTO {
  data: Message[];
  first_id: string;
  last_id: string;
  has_more: boolean;
  object: "list";
}
