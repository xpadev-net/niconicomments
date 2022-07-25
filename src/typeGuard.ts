const typeGuard = {
  formatted: {
    comment: (i: any): i is formattedComment =>
      typeVerify(i, [
        "id",
        "vpos",
        "content",
        "date",
        "date_usec",
        "owner",
        "premium",
        "mail",
        "user_id",
        "layer",
      ]),
    comments: (i: any): i is formattedComment[] => {
      if (typeof i !== "object") return false;
      for (let item of i) {
        if (!typeGuard.formatted.comment(item)) return false;
      }
      return true;
    },
    legacyComment: (i: any): i is formattedLegacyComment =>
      typeVerify(i, [
        "id",
        "vpos",
        "content",
        "date",
        "owner",
        "premium",
        "mail",
      ]),
    legacyComments: (i: any): i is formattedLegacyComment[] => {
      if (typeof i !== "object") return false;
      for (let item of i) {
        if (!typeGuard.formatted.legacyComment(item)) return false;
      }
      return true;
    },
  },
  legacy: {
    rawApiResponses: (i: any): i is rawApiResponse[] => {
      if (typeof i !== "object") return false;
      for (let itemWrapper of i) {
        for (let item of itemWrapper) {
          if (
            !(
              (item.chat && typeGuard.legacy.apiChat(item)) ||
              typeGuard.legacy.apiGlobalNumRes(item) ||
              typeGuard.legacy.apiLeaf(item) ||
              typeGuard.legacy.apiPing(item) ||
              typeGuard.legacy.apiThread(item)
            )
          ) {
            return false;
          }
        }
      }
      return true;
    },
    apiChat: (i: any): i is apiChat =>
      typeVerify(i, [
        "anonymity",
        "content",
        "date",
        "date_usec",
        "no",
        "thread",
        "vpos",
      ]),
    apiGlobalNumRes: (i: any): i is apiGlobalNumRes =>
      typeVerify(i, ["num_res", "thread"]),
    apiLeaf: (i: any): i is apiLeaf => typeVerify(i, ["count", "thread"]),
    apiPing: (i: any): i is apiPing => typeVerify(i, ["content"]),
    apiThread: (i: any): i is apiThread =>
      typeVerify(i, [
        "resultcode",
        "revision",
        "server_time",
        "thread",
        "ticket",
      ]),
  },
  niconicome: {
    xmlDocument: (i: any): i is XMLDocument => {
      if (!i.documentElement || i.documentElement.nodeName !== "packet")
        return false;
      if (!i.documentElement.children) return false;
      for (let index in Array.from(i.documentElement.children)) {
        let value = i.documentElement.children[index];
        if (index === "0") {
          if (
            value.nodeName !== "thread" ||
            !typeAttributeVerify(value, [
              "resultcode",
              "thread",
              "server_time",
              "last_res",
              "revision",
            ])
          )
            return false;
        } else {
          if (
            value.nodeName !== "chat" ||
            !typeAttributeVerify(value, [
              "thread",
              "no",
              "vpos",
              "date",
              "date_usec",
              "anonymity",
              "user_id",
              "mail",
              "leaf",
              "premium",
              "score",
            ])
          )
            return false;
        }
      }
      return true;
    },
  },
  legacyOwner: {
    comments: (i: any): boolean => {
      let lists = i.split("\n");
      for (let list in lists) {
        if (list.split(":").length < 3) {
          return false;
        }
      }
      return true;
    },
  },
  owner: {
    comment: (i: any): i is ownerComment =>
      typeVerify(i, ["time", "command", "comment"]),
    comments: (i: any): i is ownerComment[] => {
      if (typeof i !== "object") return false;
      for (let item of i) {
        if (!typeGuard.owner.comment(item)) return false;
      }
      return true;
    },
  },
  v1: {
    comment: (i: any): i is apiThread =>
      typeVerify(i, [
        "id",
        "no",
        "vposMs",
        "body",
        "commands",
        "userId",
        "isPremium",
        "score",
        "postedAt",
        "nicoruCount",
        "nicoruId",
        "source",
        "isMyPost",
      ]),
    thread: (i: any): i is v1Thread => {
      if (!typeVerify(i, ["id", "fork", "commentCount", "comments"]))
        return false;
      for (let item of i.comments) {
        if (!typeGuard.v1.comment(item)) return false;
      }
      return true;
    },
    threads: (i: any): i is v1Thread[] => {
      if (typeof i !== "object") return false;
      for (let item of i) {
        if (!typeGuard.v1.thread(item)) return false;
      }
      return true;
    },
  },
  ast: {
    Literal: (i: any): i is A_Literal => i.type === "Literal",
    Identifier: (i: any): i is A_Identifier => i.type === "Identifier",
    ExpressionStatement: (i: any): i is A_ExpressionStatement =>
      i.type === "ExpressionStatement",
    AssignmentExpression: (i: any): i is A_AssignmentExpression =>
      i.type === "AssignmentExpression",
    ArrayExpression: (i: any): i is A_ArrayExpression =>
      i.type === "ArrayExpression",
    ArrowFunctionExpression: (i: any): i is A_ArrowFunctionExpression =>
      i.type === "ArrowFunctionExpression",
    BinaryExpression: (i: any): i is A_BinaryExpression =>
      i.type === "BinaryExpression",
    BlockStatement: (i: any): i is A_BlockStatement =>
      i.type === "BlockStatement",
    CallExpression: (i: any): i is A_CallExpression =>
      i.type === "CallExpression",
    IfStatement: (i: any): i is A_IfStatement => i.type === "IfStatement",
    MemberExpression: (i: any): i is A_MemberExpression =>
      i.type === "MemberExpression",
    Program: (i: any): i is A_Program => i.type === "Program",
    UnaryExpression: (i: any): i is A_UnaryExpression =>
      i.type === "UnaryExpression",
    UpdateExpression: (i: any): i is A_UpdateExpression =>
      i.type === "UpdateExpression",
    VariableDeclaration: (i: any): i is A_VariableDeclaration =>
      i.type === "VariableDeclaration",
  },
};
const typeVerify = (item: any, keys: string[]): boolean => {
  for (let key of keys) {
    if (item[key] === undefined) return false;
  }
  return true;
};
const typeAttributeVerify = (item: any, keys: string[]): boolean => {
  for (let key of keys) {
    if (item.getAttribute(key) === null) return false;
  }
  return true;
};
export default typeGuard;
