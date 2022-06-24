import typeGuard from "@/typeGuard";

const convert = (data: any, type: string) => {
    if (type.match(/^formatted|legacy|niconicome|owner|v1$/)){

    }
}

const fromLegacy = () => {

    let data_: formattedComment[] = [];
    for (let i = 0; i < data.length; i++) {
        let val = data[i];
        if (!val) continue;
        for (let key in val) {
            let value = val[key];
            if (typeGuard.legacy.apiChat(value) && value["deleted"] !== 1) {
                let tmpParam: any = {
                    "id": value["no"],
                    "vpos": value["vpos"],
                    "content": value["content"],
                    "date": value["date"],
                    "date_usec": value["date_usec"],
                    "owner": !value["user_id"],
                    "premium": value["premium"] === 1,
                    "mail": []
                };
                if (value["mail"]) {
                    tmpParam["mail"] = value["mail"].split(/[\s　]/g);
                }
                if (value["content"].startsWith("/") && !value["user_id"]) {
                    tmpParam["mail"].push("invisible");
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

export default convert;