import type { BaseConfig, FormattedComment } from "@/@types";

const RE_CA_FILTER = /@[\d.]+|184|device:.+|patissier|ca/;
const HASH_OFFSET_A = 0x811c9dc5;
const HASH_OFFSET_B = 0x9e3779b9;
const HASH_PRIME_A = 0x01000193;
const HASH_PRIME_B = 0x85ebca6b;
const HASH_SEPARATOR = 0x1f;

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
type IndexedGroupedByTimeItem = GroupedByTimeItem & {
  bucketEnd: number;
  bucketStart: number;
  index: number;
};

/**
 * CAと思われるコメントのレイヤーを分離する
 * @param rawData コメントデータ
 * @param config インスタンス設定
 * @returns レイヤー分離後のコメントデータ
 */
const changeCALayer = (
  rawData: FormattedComment[],
  config: BaseConfig,
): FormattedComment[] => {
  const userScoreList = getUsersScore(rawData);
  const filteredComments = removeDuplicateCommentArt(rawData, config);
  const commentArts = filteredComments.filter(
    (comment) =>
      (userScoreList[comment.user_id] ?? 0) >= config.sameCAMinScore &&
      !comment.owner,
  );
  const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
  const commentArtsGroupedByTimes = groupCommentsByTime(
    commentArtsGroupedByUser,
    config,
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
      userScoreList[comment.user_id] =
        (userScoreList[comment.user_id] ?? 0) + 5;
    }
    const lineCount = (comment.content.match(/\r\n|\n|\r/g) ?? []).length;
    if (lineCount > 2) {
      userScoreList[comment.user_id] =
        (userScoreList[comment.user_id] ?? 0) + lineCount / 2;
    }
  }
  return userScoreList;
};

/**
 * 重複するコメントアートを削除する
 * @param comments コメントデータ
 * @param config インスタンス設定
 * @returns 重複を排除したコメントデータ
 */
const removeDuplicateCommentArt = (
  comments: FormattedComment[],
  config: BaseConfig,
) => {
  const index = new Map<string, FormattedComment>();
  return comments.filter((comment) => {
    const key = getCommentArtDuplicateKey(comment);
    const lastComment = index.get(key);
    if (lastComment === undefined) {
      index.set(key, comment);
      return true;
    }
    if (
      comment.vpos - lastComment.vpos > config.sameCAGap ||
      Math.abs(comment.date - lastComment.date) < config.sameCARange
    ) {
      index.set(key, comment);
      return true;
    }
    return false;
  });
};

const getCommentArtDuplicateKey = (comment: FormattedComment) => {
  const normalizedMail = Array.from(
    new Set(comment.mail.filter((mail) => !RE_CA_FILTER.test(mail))),
  ).sort((a, b) => a.localeCompare(b));
  const mailHash = hashStringList(normalizedMail);
  // Keep the duplicate key bounded even for huge CA payloads. The finite hash
  // can theoretically collide, but avoids reintroducing unbounded content keys.
  return `content=${hashString(comment.content)};mail=${mailHash}`;
};

const hashStringList = (values: string[]) => {
  const state = createHashState();
  for (const value of values) {
    mixHashCode(state, value.length);
    for (let i = 0; i < value.length; i++) {
      mixHashCode(state, value.charCodeAt(i));
    }
    mixHashCode(state, HASH_SEPARATOR);
  }
  return `${values.length}:${toBase36(state.hashA)}:${toBase36(state.hashB)}`;
};

const hashString = (value: string) => {
  const state = createHashState();
  for (let i = 0; i < value.length; i++) {
    mixHashCode(state, value.charCodeAt(i));
  }
  return `${value.length}:${toBase36(state.hashA)}:${toBase36(state.hashB)}`;
};

const createHashState = () => ({
  hashA: HASH_OFFSET_A,
  hashB: HASH_OFFSET_B,
});

const mixHashCode = (
  state: ReturnType<typeof createHashState>,
  code: number,
) => {
  state.hashA = Math.imul(state.hashA ^ code, HASH_PRIME_A);
  state.hashB =
    Math.imul(state.hashB + code, HASH_PRIME_B) ^ (state.hashB >>> 13);
};

const toBase36 = (value: number) => (value >>> 0).toString(36);

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
const groupCommentsByUser = (comments: FormattedComment[]): GroupedByUser => {
  const userMap = new Map<
    number,
    { comments: FormattedComment[]; userId: number }
  >();
  for (const comment of comments) {
    let user = userMap.get(comment.user_id);
    if (!user) {
      user = { userId: comment.user_id, comments: [] };
      userMap.set(comment.user_id, user);
    }
    user.comments.push(comment);
  }
  return Array.from(userMap.values());
};

/**
 * ユーザーごとにグループ化されたコメントを時間ごとにグループ化する
 * @param comments ユーザーごとにグループ化されたコメントデータ
 * @param config インスタンス設定
 * @returns 時間ごとにグループ化されたコメントデータ
 */
const groupCommentsByTime = (comments: GroupedByUser, config: BaseConfig) => {
  return comments.map((user) => ({
    userId: user.userId,
    comments: groupUserCommentsByTime(user.comments, config),
  }));
};

/**
 * ユーザー内のコメントを入力順に走査して時間ごとにグループ化する
 * @param comments ユーザー単位のコメントデータ
 * @param config インスタンス設定
 * @returns 時間ごとにグループ化したコメントデータ
 */
const groupUserCommentsByTime = (
  comments: FormattedComment[],
  config: BaseConfig,
) => {
  const result: IndexedGroupedByTimeItem[] = [];
  const bucketSize = getTimeBucketSize(config);
  const bucketIndex = new Map<number, Set<IndexedGroupedByTimeItem>>();

  for (const comment of comments) {
    let time = getTimeFromBucketIndex(
      comment.date,
      bucketSize,
      bucketIndex,
      config,
    );
    if (time === undefined) {
      time = {
        bucketEnd: 0,
        // Inverted range means no buckets have been registered yet.
        bucketStart: 1,
        index: result.length,
        range: {
          start: comment.date,
          end: comment.date,
        },
        comments: [],
      };
      result.push(time);
    }
    time.comments.push(comment);
    time.range.start = Math.min(time.range.start, comment.date);
    time.range.end = Math.max(time.range.end, comment.date);
    updateTimeBucketIndex(time, bucketSize, bucketIndex, config);
  }

  return result;
};

const getTimeFromBucketIndex = (
  time: number,
  bucketSize: number,
  bucketIndex: Map<number, Set<IndexedGroupedByTimeItem>>,
  config: BaseConfig,
) => {
  const candidates = bucketIndex.get(getTimeBucket(time, bucketSize));
  if (candidates === undefined) return undefined;
  let result: IndexedGroupedByTimeItem | undefined;
  for (const candidate of candidates) {
    if (
      (result === undefined || candidate.index < result.index) &&
      isSameCommentArtTime(time, candidate, config)
    ) {
      result = candidate;
    }
  }
  return result;
};

const updateTimeBucketIndex = (
  time: IndexedGroupedByTimeItem,
  bucketSize: number,
  bucketIndex: Map<number, Set<IndexedGroupedByTimeItem>>,
  config: BaseConfig,
) => {
  const bucketStart = getTimeBucket(
    time.range.start - config.sameCATimestampRange,
    bucketSize,
  );
  const bucketEnd = getTimeBucket(
    time.range.end + config.sameCATimestampRange,
    bucketSize,
  );
  if (!Number.isFinite(bucketStart) || !Number.isFinite(bucketEnd)) return;
  for (let bucket = bucketStart; bucket <= bucketEnd; bucket++) {
    if (bucket >= time.bucketStart && bucket <= time.bucketEnd) continue;
    let bucketItems = bucketIndex.get(bucket);
    if (bucketItems === undefined) {
      bucketItems = new Set();
      bucketIndex.set(bucket, bucketItems);
    }
    bucketItems.add(time);
  }
  time.bucketStart = bucketStart;
  time.bucketEnd = bucketEnd;
};

const getTimeBucketSize = (config: BaseConfig) =>
  config.sameCATimestampRange === Infinity
    ? Infinity
    : Number.isFinite(config.sameCATimestampRange) &&
        config.sameCATimestampRange > 0
      ? Math.ceil(config.sameCATimestampRange * 2) + 1
      : 1;

const getTimeBucket = (time: number, bucketSize: number) =>
  bucketSize === Infinity ? 0 : Math.floor(time / bucketSize);

const isSameCommentArtTime = (
  time: number,
  timeObj: GroupedByTimeItem,
  config: BaseConfig,
) =>
  timeObj.range.start - config.sameCATimestampRange <= time &&
  timeObj.range.end + config.sameCATimestampRange >= time;

export { changeCALayer };
