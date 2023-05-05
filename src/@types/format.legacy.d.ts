export type RawApiResponse = {
  [key: string]: ApiPing | ApiThread | ApiLeaf | ApiGlobalNumRes | ApiChat;
};
export type ApiPing = {
  content: string;
};
export type ApiThread = {
  resultcode: number;
  thread: string;
  server_time: number;
  ticket: string;
  revision: number;
};
export type ApiLeaf = {
  thread: string;
  count: number;
};
export type ApiGlobalNumRes = {
  thread: string;
  num_res: number;
};
export type ApiChat = {
  thread: string;
  no: number;
  vpos: number;
  date: number;
  date_usec: number;
  nicoru: number;
  premium: number;
  anonymity: number;
  user_id: string;
  mail: string;
  content: string;
  deleted: number;
};

/**
 * @deprecated
 */
export type rawApiResponse = RawApiResponse;
