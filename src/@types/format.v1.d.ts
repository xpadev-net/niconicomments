type v1Thread = {
  id: string;
  fork: string;
  commentCount: number;
  comments: { [key: string]: v1Comment };
};
type v1Comment = {
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
