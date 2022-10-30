type rawApiResponse = {
  [key: string]: apiPing | apiThread | apiLeaf | apiGlobalNumRes | apiChat;
};
type apiPing = {
  content: string;
};
type apiThread = {
  resultcode: number;
  thread: string;
  server_time: number;
  ticket: string;
  revision: number;
};
type apiLeaf = {
  thread: string;
  count: number;
};
type apiGlobalNumRes = {
  thread: string;
  num_res: number;
};
type apiChat = {
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
