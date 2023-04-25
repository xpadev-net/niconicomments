import { formattedComment } from "@/@types";
import { config } from "@/definition/config";

type GroupedByUser = {
  comments: formattedComment[];
  userId: number;
}[];
type GroupedByTime = {
  comments: GroupedByTimeItem[];
  userId: number;
}[];
type GroupedByTimeItem = {
  comments: formattedComment[];
  range: {
    start: number;
    end: number;
  };
};

/**
 * CAと思われるコメントのレイヤーを分離する
 * @param {formattedComment[]} rawData
 */
const changeCALayer = (rawData: formattedComment[]): formattedComment[] => {
  const userScoreList = getUsersScore(rawData);
  const filteredComments = removeDuplicateCommentArt(rawData);
  const commentArts = filteredComments.filter(
    (comment) =>
      (userScoreList[comment.user_id] || 0) >= config.sameCAMinScore &&
      !comment.owner
  );
  const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
  const commentArtsGroupedByTimes = groupCommentsByTime(
    commentArtsGroupedByUser
  );
  updateLayerId(commentArtsGroupedByTimes);
  return filteredComments;
};

/**
 * ユーザーごとのコメントアートスコアを取得する
 * @param {formattedComment} comments
 * @returns {[key: string]: number}
 */
const getUsersScore = (
  comments: formattedComment[]
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
    const lineCount = (comment.content.match(/\r\n|\n|\r/g) || []).length;
    if (lineCount > 2) {
      userScoreList[comment.user_id] += lineCount / 2;
    }
  }
  return userScoreList;
};

/**
 * 重複するコメントアートを削除する
 * @param {formattedComment[]} comments
 * @return {formattedComment[]}
 */
const removeDuplicateCommentArt = (comments: formattedComment[]) => {
  const index: { [key: string]: formattedComment } = {};
  return comments.filter((comment) => {
    const key = `${comment.content}@@${[...comment.mail]
        .sort()
        .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
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
 * @param {GroupedByTime}filteredComments
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
 * @param {formattedComment[]} comments
 * @returns {GroupedByUser}
 */
const groupCommentsByUser = (comments: formattedComment[]) => {
  return comments.reduce((users, comment) => {
    const user = getUser(comment.user_id, users);
    user.comments.push(comment);
    return users;
  }, [] as GroupedByUser);
};

/**
 * ユーザー配列から該当のユーザーの参照を取得する
 * @param {number} userId 探す対処のuserId
 * @param {GroupedByUser} users
 */
const getUser = (userId: number, users: GroupedByUser) => {
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
 * @param {GroupedByUser} comments
 * @returns {GroupedByTime}
 */
const groupCommentsByTime = (comments: GroupedByUser) => {
  return comments.reduce((result, user) => {
    result.push({
      userId: user.userId,
      comments: user.comments.reduce((result, comment) => {
        const time = getTime(comment.date, result);
        time.comments.push(comment);
        time.range.start = Math.min(time.range.start, comment.date);
        time.range.end = Math.max(time.range.end, comment.date);
        return result;
      }, [] as GroupedByTimeItem[]),
    });
    return result;
  }, [] as GroupedByTime);
};

/**
 * 時間配列から該当の時間の参照を取得する
 * @param {number} time
 * @param {GroupedByTimeItem[]} times
 */
const getTime = (time: number, times: GroupedByTimeItem[]) => {
  const timeObj = times.find(
    (timeObj) =>
      timeObj.range.start - config.sameCATimestampRange <= time &&
      timeObj.range.end + config.sameCATimestampRange >= time
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
