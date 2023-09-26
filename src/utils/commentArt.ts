import type { FormattedComment } from "@/@types";
import { config } from "@/definition/config";

type GroupedByUser = {
  comments: FormattedComment[];
  userId: number;
}[];
type GroupedByTime = {
  comments: GroupedByTimeItem[];
  userId: number;
}[];
type GroupedByTimeItem = {
  comments: FormattedComment[];
  range: {
    start: number;
    end: number;
  };
};

/**
 * CAと思われるコメントのレイヤーを分離する
 * @param rawData コメントデータ
 * @returns レイヤー分離後のコメントデータ
 */
const changeCALayer = (rawData: FormattedComment[]): FormattedComment[] => {
  const userScoreList = getUsersScore(rawData);
  const filteredComments = removeDuplicateCommentArt(rawData);
  const commentArts = filteredComments.filter(
    (comment) =>
      (userScoreList[comment.user_id] ?? 0) >= config.sameCAMinScore &&
      !comment.owner,
  );
  const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
  const commentArtsGroupedByTimes = groupCommentsByTime(
    commentArtsGroupedByUser,
  );
  updateLayerId(commentArtsGroupedByTimes);
  return filteredComments;
};

/**
 * ユーザーごとのコメントアートスコアを取得する
 * @param comments コメントデータ
 * @returns ユーザーIDごとのスコア
 */
const getUsersScore = (
  comments: FormattedComment[],
): { [key: string]: number } => {
  const userScoreList: { [key: number]: number } = {};
  for (const comment of comments) {
    if (comment.user_id === undefined || comment.user_id === -1) continue;
    userScoreList[comment.user_id] ||= 0;
    if (
      comment.mail.includes("ca") ||
      comment.mail.includes("patissier") ||
      comment.mail.includes("ender") ||
      comment.mail.includes("full")
    ) {
      userScoreList[comment.user_id] += 5;
    }
    const lineCount = (comment.content.match(/\r\n|\n|\r/g) ?? []).length;
    if (lineCount > 2) {
      userScoreList[comment.user_id] += lineCount / 2;
    }
  }
  return userScoreList;
};

/**
 * 重複するコメントアートを削除する
 * @param comments コメントデータ
 * @returns 重複を排除したコメントデータ
 */
const removeDuplicateCommentArt = (comments: FormattedComment[]) => {
  const index: { [key: string]: FormattedComment } = {};
  return comments.filter((comment) => {
    const key = `${comment.content}@@${[...comment.mail]
        .sort()
        .filter((e) => !RegExp(/@[\d.]+|184|device:.+|patissier|ca/).exec(e))
        .join("")}`,
      lastComment = index[key];
    if (lastComment === undefined) {
      index[key] = comment;
      return true;
    }
    if (
      comment.vpos - lastComment.vpos > config.sameCAGap ||
      Math.abs(comment.date - lastComment.date) < config.sameCARange
    ) {
      index[key] = comment;
      return true;
    }
    return false;
  });
};

/**
 * レイヤーIDを更新する
 * @param filteredComments 更新対象のコメントデータ
 */
const updateLayerId = (filteredComments: GroupedByTime) => {
  let layerId = 0;
  for (const user of filteredComments) {
    for (const time of user.comments) {
      for (const comment of time.comments) {
        comment.layer = layerId;
      }
      layerId++;
    }
  }
};

/**
 * ユーザーごとにコメントをグループ化する
 * @param comments コメントデータ
 * @returns ユーザーごとにグループ化したコメントデータ
 */
const groupCommentsByUser = (comments: FormattedComment[]) => {
  return comments.reduce<GroupedByUser>((users, comment) => {
    const user = getUser(comment.user_id, users);
    user.comments.push(comment);
    return users;
  }, []);
};

/**
 * ユーザー配列から該当のユーザーの参照を取得する
 * @param userId 探す対処のuserId
 * @param users ユーザー配列
 * @returns 該当のユーザーの参照
 */
const getUser = (
  userId: number,
  users: GroupedByUser,
): { comments: FormattedComment[]; userId: number } => {
  const user = users.find((user) => user.userId === userId);
  if (user) return user;
  const obj = {
    userId,
    comments: [],
  };
  users.push(obj);
  return obj;
};

/**
 * ユーザーごとにグループ化されたコメントを時間ごとにグループ化する
 * @param comments ユーザーごとにグループ化されたコメントデータ
 * @returns 時間ごとにグループ化されたコメントデータ
 */
const groupCommentsByTime = (comments: GroupedByUser) => {
  return comments.reduce<GroupedByTime>((result, user) => {
    result.push({
      userId: user.userId,
      comments: user.comments.reduce<GroupedByTimeItem[]>((result, comment) => {
        const time = getTime(comment.date, result);
        time.comments.push(comment);
        time.range.start = Math.min(time.range.start, comment.date);
        time.range.end = Math.max(time.range.end, comment.date);
        return result;
      }, []),
    });
    return result;
  }, []);
};

/**
 * 時間配列から該当の時間の参照を取得する
 * @param time 探す対象の時間
 * @param times 時間配列
 * @returns 該当の時間の参照
 */
const getTime = (
  time: number,
  times: GroupedByTimeItem[],
): GroupedByTimeItem => {
  const timeObj = times.find(
    (timeObj) =>
      timeObj.range.start - config.sameCATimestampRange <= time &&
      timeObj.range.end + config.sameCATimestampRange >= time,
  );
  if (timeObj) return timeObj;
  const obj = {
    range: {
      start: time,
      end: time,
    },
    comments: [],
  };
  times.push(obj);
  return obj;
};

export { changeCALayer };
