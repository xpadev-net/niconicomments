export type FormattedComment = {
  id: number;
  vpos: number;
  content: string;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
  user_id: number;
  layer: number;
  is_my_post: boolean;
};
export type FormattedLegacyComment = {
  id: number;
  vpos: number;
  content: string;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
};

/**
 * @deprecated
 */
export type formattedComment = FormattedComment;
/**
 * @deprecated
 */
export type formattedLegacyComment = FormattedLegacyComment;
