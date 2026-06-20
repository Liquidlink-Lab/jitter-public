import type { JitterConfigNetworkInput } from "../config.js";

export type EventReaderQuery = {
  network: JitterConfigNetworkInput;
  eventType: string;
  limit?: number;
  order?: "ascending" | "descending";
};

export interface JitterEventReader {
  queryEvents<TEvent>(query: EventReaderQuery): Promise<TEvent[]>;
}
