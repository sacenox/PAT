export type Thread = {
  id: number;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: number;
  threadId: number;
  role: string;
  content: string;
  createdAt: Date;
  generationTimeMs: number | null;
};

