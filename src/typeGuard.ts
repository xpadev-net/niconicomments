const typeGuard = {
    formatted: {
        comment: (i: any): i is formattedComment =>
            typeVerify(i, ["id", "vpos", "content", "date", "date_usec", "owner", "premium", "mail"]),
        comments: (i: any): i is formattedComment[] => {
            if (typeof i !== "object") return false;
            for (let item of i) {
                if (!typeGuard.formatted.comment(item)) return false;
            }
            return true;
        }
    },
    legacy: {
        rawApiResponses: (i: any): i is rawApiResponse[] => {
            if (typeof i !== "object") return false;
            for (let item of i) {
                if (!(typeGuard.legacy.apiChat(item) || typeGuard.legacy.apiGlobalNumRes(item) || typeGuard.legacy.apiLeaf(item) || typeGuard.legacy.apiPing(item) || typeGuard.legacy.apiThread(item))) {
                    return false
                }
            }
            return true
        },
        apiChat: (i: any): i is apiChat =>
            typeVerify(i, ["anonymity", "content", "date", "date_usec", "no", "thread", "vpos"]),
        apiGlobalNumRes: (i: any): i is apiGlobalNumRes =>
            typeVerify(i, ["num_res", "thread"]),
        apiLeaf: (i: any): i is apiLeaf =>
            typeVerify(i, ["count", "thread"]),
        apiPing: (i: any): i is apiPing =>
            typeVerify(i, ["content"]),
        apiThread: (i: any): i is apiThread =>
            typeVerify(i, ["resultcode", "revision", "server_time", "thread", "ticket"]),
    },
    niconicome:{

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
        }

    },
    v1: {
        comment: (i: any): i is apiThread =>
            typeVerify(i, ["id", "no", "vposMs", "body", "commands", "userId", "isPremium", "score", "postedAt", "nicoruCount", "nicoruId", "source", "isMyPost"]),
        thread: (i: any): i is v1Thread => {
            if (!typeVerify(i, ["id", "fork", "commentCount", "comments"])) return false;
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
    }
}
const typeVerify = (item: any, keys: string[]): boolean => {
    for (let key of keys) {
        if (item[key] === undefined) return false;
    }
    return true
}
export default typeGuard;