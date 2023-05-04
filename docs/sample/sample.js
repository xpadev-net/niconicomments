const videos = [
  {
    title: i18next.t("general"),
    items: [
      {
        id: 0,
        nc: "sm9",
        yt: "PumFnlu9EIY",
        title: "新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師",
        scale: 75,
      },
      {
        id: 1,
        nc: "sm9",
        yt: "PumFnlu9EIY",
        title: i18next.t("sm9_2"),
        scale: 75,
      },
      {
        id: 2,
        nc: "sm2959233",
        yt: "pv2IzP2CyRs",
        title: "ニコニコ動画流星群",
        scale: 75,
      },
      {
        id: 3,
        nc: "sm2959233",
        yt: "pv2IzP2CyRs",
        title: i18next.t("sm2959233_2"),
        scale: 75,
      },
    ],
  },
  {
    title: "Comment Art",
    items: [
      {
        id: 4,
        nc: "sm21172249",
        yt: "8NBcQgEpkbk",
        title: "アンインストール　Arrange.ver【コメント職人】@2018/10/1",
        bg: "black",
      },
      {
        id: 20,
        nc: "sm21172249",
        yt: "8NBcQgEpkbk",
        title: "アンインストール　Arrange.ver【コメント職人】@2022/06/22",
        bg: "black",
      },
      {
        id: 5,
        nc: "sm34968071",
        yt: "8NBcQgEpkbk",
        title: "投コメ アンインストール",
        bg: "black",
      },
      {
        id: 11,
        nc: "sm40491399",
        yt: "8mdkdg7vrXg",
        title: "【コマテ】アンインストール　Full.ver",
        bg: "black",
      },
      {
        id: 6,
        nc: "so35384944",
        yt: "S2_MZFHTYYk",
        title: "よいまちカンターレ",
        scale: 57,
      },
      {
        id: 7,
        nc: "so17588662",
        yt: "29NR161Bmd4",
        title: "to the beginning@2012/04/28",
      },
      {
        id: 8,
        nc: "so17784068",
        yt: "dW_5Q7uCS7Y",
        title: "満天@2012/05/19",
        bg: "black",
      },
      {
        id: 9,
        nc: "sm38551701",
        yt: "m8cdPwNZShM",
        title: "【Babo】うっせぇわ　踊ってみた【オリジナル振付】",
      },
      {
        id: 10,
        nc: "so35349120",
        yt: "yQEUGxngQN4",
        title: "Good Morning World@2019/11/22",
      },
      {
        id: 12,
        nc: "so40344074",
        yt: "vnO2R66BaYo",
        title: "AHAREN HEART@2022/04/29",
      },
      {
        id: 13,
        nc: "sm39927524",
        yt: "6doKKoHQmTI",
        title: "【明日ちゃんのセーラー服】OPで歌詞コメントアート",
      },
      {
        id: 14,
        nc: "sm39947424",
        yt: "shs0rAiwsGQ",
        title: "職人よ集え！この動画を完成させてくれ！のコマテ動画のようなもの",
        bg: "black",
      },
      {
        id: 15,
        nc: "so40036953",
        yt: "tLQLa6lM3Us",
        title: "残響散歌@2022/02/17",
        bg: "black",
      },
      {
        id: 16,
        nc: "so40558701",
        yt: "8vHMfwtbpZk",
        title: "BROKEN IDENTITY",
      },
      {
        id: 17,
        nc: "so40558701",
        yt: "eICFWaCkjRA",
        title: "de messiah",
        bg: "black",
      },
      {
        id: 18,
        nc: "sm40563674",
        yt: "m2M2piEMWAE",
        title: "コメントでけものフレンズのキャラを作ってみた",
        bg: "white",
      },
      {
        id: 19,
        nc: "sm500873",
        yt: "RsO2eD3V_wY",
        title: i18next.t("sm500873"),
        scale: 75,
      },
      {
        id: 21,
        nc: "so40760886",
        yt: "VxR_BYPG7v4",
        title: "ClariS「ALIVE」(リコリス・リコイル op)",
      },
      {
        id: 22,
        nc: "sm20778311",
        yt: "3UdXw4PIHeg",
        title: "【MAD】文学少女　ヨワイボクラハウタウ@2013/07/11",
      },
      {
        id: 23,
        nc: "nm14999484",
        yt: "cq_iM5gDzpQ",
        title:
          "【読込激重】魔法少女まどか☆マギカ完結版OPをコメントでry【元動画１】",
      },
      {
        id: 24,
        nc: "nm14999567",
        yt: "cq_iM5gDzpQ",
        title:
          "【読込激重】魔法少女まどか☆マギカ完結版OPをコメントでry【元動画２】",
      },
    ],
  },
  {
    title: i18next.t("debug"),
    items: [
      {
        id: -1,
        nc: i18next.t("operation_check"),
        yt: "m2M2piEMWAE",
        title: i18next.t("debug_ca"),
      },
    ],
  },
];
const urlParams = new URLSearchParams(window.location.search);
let video = Number(urlParams.get("video") || 0),
  player,
  interval = null,
  nico = null,
  mode = "default",
  showFPS = false,
  showCollision = false,
  showCommentCount = false,
  videoMicroSec = false,
  keepCA = false,
  debug = false,
  scale = 1;
/** @type {HTMLDivElement} */
const controlWrapper = document.getElementById("control");
/** @type {HTMLSelectElement} */
const controlVideoElement = document.getElementById("control-video");
/** @type {HTMLInputElement} */
const controlShowFPSElement = document.getElementById("show-fps");
/** @type {HTMLInputElement} */
const controlShowCollisionElement = document.getElementById("show-collision");
/** @type {HTMLInputElement} */
const controlShowCommentCountElement =
  document.getElementById("show-comment-count");
/** @type {HTMLInputElement} */
const controlModeElement = document.getElementById("mode");
/** @type {HTMLInputElement} */
const controlKeepCAElement = document.getElementById("keep-ca");
/** @type {HTMLInputElement} */
const controlDebugElement = document.getElementById("debug");
/** @type {HTMLInputElement} */
const controlScaleElement = document.getElementById("scale");
/** @type {HTMLInputElement} */
const controlToggleElement = document.getElementById("toggle");
/** @type {HTMLDivElement} */
const container = document.getElementById("container");
/** @type {HTMLCanvasElement} */
const canvasElement = document.getElementById("canvas");
/** @type {HTMLDivElement} */
const backgroundElement = document.getElementById("background");

const onYouTubeIframeAPIReady = () => {
  for (const group of videos) {
    const groupElement = document.createElement("optgroup");
    groupElement.label = group.title;
    for (const item of group.items) {
      const optionElement = document.createElement("option");
      optionElement.value = item.id;
      optionElement.text = `${item.title}(${item.nc})`;
      if (item.id === Number(video)) {
        optionElement.selected = true;
      }
      groupElement.appendChild(optionElement);
    }
    controlVideoElement.appendChild(groupElement);
  }
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: getById(videos, video).yt,
    events: {
      onReady: onReady,
      onStateChange: updateTime,
    },
  });
};

const onReady = () => {
  controlWrapper.style.display = "flex";
  const videoItem = getVideoItem();
  document.title = `${videoItem.title}(${videoItem.nc}) - niconicomments sample`;
  void loadComments();
};

controlVideoElement.onchange = (e) => {
  video = e.target.value;
  const videoItem = getVideoItem();
  player.loadVideoById({
    videoId: videoItem.yt,
    suggestedQuality: "large",
  });
  void loadComments();
  urlParams.set("video", video);
  document.title = `${videoItem.title}(${videoItem.nc}) - niconicomments sample`;
  history.pushState(
    "",
    "",
    `${window.location.pathname}?${urlParams.toString()}`
  );
};
controlShowFPSElement.onchange = (e) => {
  nico.showFPS = showFPS = e.target.checked;
};
controlShowCollisionElement.onchange = (e) => {
  nico.showCollision = showCollision = e.target.checked;
};
controlShowCommentCountElement.onchange = (e) => {
  nico.showCommentCount = showCommentCount = e.target.checked;
};
controlModeElement.onchange = (e) => {
  mode = e.target.value;
  void loadComments();
};
controlKeepCAElement.onchange = (e) => {
  keepCA = e.target.checked;
  void loadComments();
};
controlDebugElement.onchange = (e) => {
  debug = e.target.checked;
  void loadComments();
};
controlScaleElement.onchange = (e) => {
  scale = e.target.value;
  void loadComments();
};
controlToggleElement.onclick = () => {
  controlWrapper.classList.toggle("close");
};

const updateTime = (e) => {
  if (e === 1) {
    videoMicroSec = {
      currentTime: player.getCurrentTime(),
      microsec: performance.now(),
    };
  } else {
    videoMicroSec = false;
  }
};

const updateCanvas = () => {
  nico.drawCanvas(Math.floor(player.getCurrentTime() * 100));
  requestAnimationFrame(updateCanvas);
};

const loadComments = async () => {
  const videoItem = getVideoItem();
  canvasElement.style.transform = `scale(${(videoItem.scale || 100) - 1}%)`;
  const req = await fetch(`./commentdata/${video}.json`);
  const res = await req.json();

  nico = new NiconiComments(canvasElement, res, {
    mode: mode,
    keepCA: keepCA,
    format: "formatted",
    debug: debug,
    scale: Number(scale),
    config: {
      plugins: window.Niwango ? [window.Niwango] : [],
    },
  });
  const background = getById(videos, video).bg;
  backgroundElement.style.background = background || "none";
  if (urlParams.get("time")) {
    player.seekTo(Number(urlParams.get("time")), true);
  }
  if (!interval) {
    updateCanvas();
    interval = 1;
  }
  const handler = (e) => {
    console.log(e);
  };
  nico.addEventListener("commentDisable", handler);
  nico.addEventListener("commentEnable", handler);
  nico.addEventListener("seekDisable", handler);
  nico.addEventListener("seekEnable", handler);
  nico.addEventListener("jump", handler);
};

const getById = (array, id) => {
  for (const i of array) {
    for (const j of i.items) {
      if (j.id === Number(id)) {
        return j;
      }
    }
  }
  return false;
};
const resize = () => {
  const width = document.body.clientWidth / 1920,
    height = document.body.clientHeight / 1080;
  container.style.transform = `translate(-50%,-50%) scale(${
    Math.min(height, width) * 100
  }%)`;
};

const getVideoItem = () => {
  return getById(videos, video);
};
window.onresize = resize;
window.onload = resize;
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;