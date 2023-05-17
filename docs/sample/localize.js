const localize = {
  movie: ["Movie", "動画"],
  mode: ["Mode", "モード"],
  scale: ["Scale", "スケール"],
  auto: ["Auto", "自動"],
  showFPS: ["show FPS", "FPS表示"],
  showCollision: ["show Collision", "当たり判定表示"],
  showCommentCount: ["show Comment Count", "コメント数表示"],
  keepCA: ["keep Comment Art", "CA衝突回避"],
  debug: ["debug", "デバッグ"],
  general: ["general", "一般"],
  sm9_2: [
    "新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師(enlarged edition)",
    "新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師(コメント増量版)",
  ],
  sm2959233_2: [
    "ニコニコ動画流星群(50229 comments)",
    "ニコニコ動画流星群(50229コメ)",
  ],
  sm500873: [
    "組曲『ニコニコ動画』 (15th anniversary comment art only)",
    "組曲『ニコニコ動画』 (15周年CA抽出版)",
  ],
  debug_ca: ["fixed template", "各固定テンプレ"],
  operation_check: ["for operation check", "動作確認用"],
  script_art: ["script art", "スクリプトアート"],
};
const resources = { en: { translation: {} }, ja: { translation: {} } };
for (const key in localize) {
  resources.en.translation[key] = localize[key][0];
  resources.ja.translation[key] = localize[key][1];
}
i18next.use(i18nextBrowserLanguageDetector).init({
  fallbackLng: "en",
  debug: false,
  resources: resources,
});
const i18nList = document.querySelectorAll("[data-i18n]");
i18nList.forEach(function (v) {
  v.innerText = i18next.t(v.dataset.i18n);
});
