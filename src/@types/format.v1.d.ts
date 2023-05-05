export type V1Thread = {
  id: string;
  fork: string;
  commentCount: number;
  comments: V1Comment[];
};
export type V1Comment = {
  id: string;
  no: number;
  vposMs: number;
  body: string;
  commands: string[];
  userId: string;
  isPremium: boolean;
  score: number;
  postedAt: string;
  nicoruCount: number;
  nicoruId: undefined;
  source: string;
  isMyPost: boolean;
};

/**
 * @deprecated
 */
export type v1Thread = V1Thread;
