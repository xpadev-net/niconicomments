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
  const userScoreList: { [key: number]: number } = {};
  const data: formattedComment[] = [],
    index: { [key: string]: formattedComment } = {};
  for (const value of rawData) {
    if (value.user_id === undefined || value.user_id === -1) continue;
    if (userScoreList[value.user_id] === undefined)
      userScoreList[value.user_id] = 0;
    if (
      value.mail.indexOf("ca") > -1 ||
      value.mail.indexOf("patissier") > -1 ||
      value.mail.indexOf("ender") > -1 ||
      value.mail.indexOf("full") > -1
    ) {
      userScoreList[value.user_id] += 5;
    }
    if ((value.content.match(/\r\n|\n|\r/g) || []).length > 2) {
      userScoreList[value.user_id] +=
        (value.content.match(/\r\n|\n|\r/g) || []).length / 2;
    }
    const key = `${value.content}@@${[...value.mail]
        .sort()
        .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
        .join("")}`,
      lastComment = index[key];
    if (lastComment !== undefined) {
      if (
        value.vpos - lastComment.vpos > config.sameCAGap ||
        Math.abs(value.date - lastComment.date) < config.sameCARange
      ) {
        data.push(value);
        index[key] = value;
      }
    } else {
      data.push(value);
      index[key] = value;
    }
  }
  const filteredComments = groupCommentsByTime(
    groupCommentsByUser(
      data.filter(
        (comment) =>
          (userScoreList[comment.user_id] || 0) >= config.sameCAMinScore &&
          !comment.owner
      )
    )
  );
  updateLayerId(filteredComments);
  return data;
};

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

const groupCommentsByUser = (comments: formattedComment[]) => {
  return comments.reduce((users, comment) => {
    const user = getUser(comment.user_id, users);
    user.comments.push(comment);
    return users;
  }, [] as GroupedByUser);
};

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
