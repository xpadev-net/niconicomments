import typeGuard from "@/typeGuard";

const convert = (data: any, type: string) => {
    if (data instanceof DOMParser) {
        return fromNiconicome(data);
    } else if (typeGuard.formatted.legacyComments(data)&&type==="formatted") {
        return fromFormatted(data);
    } else if (typeGuard.legacy.rawApiResponses(data)&&type==="legacy") {
        return fromLegacy(data);
    } else if (typeGuard.owner.comments(data)&&type==="owner") {
        return fromOwner(data);
    } else if (typeGuard.v1.threads(data)) {
        return fromV1(data);
    }else{
        throw new Error("unknown input format");
    }
}
const fromNiconicome = (data: DOMParser): formattedComment[] => {

}

const fromFormatted = (data: formattedComment[]|formattedLegacyComment[]):formattedComment[] => {
    const tmpData = data as formattedComment[];
    if (!typeGuard.formatted.comments(data)) {
        for (let i in tmpData) {
            tmpData[i]!.layer = -1;
            tmpData[i]!.user_id = 0;
        }
    }
    return tmpData;
}

const fromLegacy = (data: rawApiResponse[]):formattedComment[] => {
    let data_: formattedComment[] = [], userList: string[] = [];
    for (let i = 0; i < data.length; i++) {
        let val = data[i];
        if (!val) continue;
        for (let key in val) {
            let value = val[key];
            if (typeGuard.legacy.apiChat(value) && value.deleted !== 1) {
                let tmpParam: any = {
                    "id": value.no,
                    "vpos": value.vpos,
                    "content": value.content,
                    "date": value.date,
                    "date_usec": value.date_usec,
                    "owner": !value.user_id,
                    "premium": value.premium === 1,
                    "mail": [],
                    "user_id": -1,
                    "layer": -1
                };
                if (value.mail) {
                    tmpParam.mail = value.mail.split(/[\s　]/g);
                }
                if (value.content.startsWith("/") && !value.user_id) {
                    tmpParam.mail.push("invisible");
                }
                let isUserExist = userList.indexOf(value.mail)
                if (isUserExist === -1) {
                    tmpParam.user_id = userList.length;
                    userList.push(value.user_id);
                } else {
                    tmpParam.user_id = isUserExist;
                }
                data_.push(tmpParam);
            }
        }
    }
    data_.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.date_usec < b.date_usec) return -1;
        if (a.date_usec > b.date_usec) return 1;
        return 0;
    });
    return data_;
}

const fromOwner = (data: ownerComment[]): formattedComment[] => {
    let data_: formattedComment[] = [];
    for (let i = 0; i < data.length; i++) {
        let value = data[i]!;
        let tmpParam: formattedComment = {
            "id": i,
            "vpos": time2vpos(value.time),
            "content": value.comment,
            "date": i,
            "date_usec": 0,
            "owner": true,
            "premium": true,
            "mail": [],
            "user_id": -1,
            "layer": -1
        };
        if (value.command) {
            tmpParam.mail = value.command.split(/[\s　]/g);
        }
        if (tmpParam.content.startsWith("/")) {
            tmpParam.mail.push("invisible");
        }
        data_.push(tmpParam);
    }
    data_.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.date_usec < b.date_usec) return -1;
        if (a.date_usec > b.date_usec) return 1;
        return 0;
    });
    return data_;
}

const fromV1 = (data: v1Thread[]): formattedComment[] => {
    let data_: formattedComment[] = [], userList: string[] = [];
    for (let i = 0; i < data.length; i++) {
        const val = data[i]!.comments,forkName = data[i]!.fork;
        for (let key in val) {
            let value: v1Comment = val[key]!;
            let tmpParam: formattedComment = {
                "id": value.no,
                "vpos": Math.floor(value.vposMs*10),
                "content": value.body,
                "date": date2time(value.postedAt),
                "date_usec": 0,
                "owner": forkName==="owner",
                "premium": value.isPremium,
                "mail": value.commands,
                "user_id": -1,
                "layer": -1
            };
            if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                tmpParam.mail.push("invisible");
            }
            let isUserExist = userList.indexOf(value.userId)
            if (isUserExist === -1) {
                tmpParam.user_id = userList.length;
                userList.push(value.userId);
            } else {
                tmpParam.user_id = isUserExist;
            }
            data_.push(tmpParam);
        }
    }
    data_.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.date_usec < b.date_usec) return -1;
        if (a.date_usec > b.date_usec) return 1;
        return 0;
    });
    return data_;

}

const time2vpos = (time_str: string): number => {
    const time = time_str.match(/^(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+)$/);
    if (time){
        if (time[1]){
            return (Number(time[1])*60+Number(time[2]))*100+Number(time[3]);
        }else if(time[4]){
            return (Number(time[4])*60+Number(time[5]))*100;
        }else if(time[6]){
            return Number(time[6])*100+Number(time[7]);
        }else if(time[8]){
            return Number(time[8])*100;
        }
    }
    return 0;
}

const date2time = (date: string): number =>
    Math.floor(new Date(date).getTime()/1000);

export default convert;