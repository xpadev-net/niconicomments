type Options = {
    useLegacy: boolean,
    formatted: boolean,
    video: HTMLVideoElement | null,
    showCollision: boolean,
    showFPS: boolean,
    showCommentCount: boolean,
    drawAllImageOnLoad: boolean
}
type parsedComment = {
    id: number,
    vpos: number,
    content: string,
    date: number,
    date_usec: number,
    owner: boolean,
    premium: boolean,
    mail: string[],
    loc: string,
    size: string,
    fontSize: number,
    font: string,
    color: string,
    full: boolean,
    ender: boolean,
    _live: boolean,
    invisible: boolean,
    long: number,
    posY: number,
    height: number,
    width_max: number,
}
type measureTextResult = {
    "width": number,
    "width_max": number,
    "width_min": number,
    "height": number,
    "resized": boolean,
    "fontSize": number
}
type fontSize = {
    [key: string]: {
        "default": number,
        "resized": number
    }
}