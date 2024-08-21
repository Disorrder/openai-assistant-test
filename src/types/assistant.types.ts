export interface Thread {
  id: string;
  title: string;
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
    annotations: any[]; // TODO: Define the type
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
