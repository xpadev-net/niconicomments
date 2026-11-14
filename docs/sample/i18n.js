/**
 * sample ページの i18n 初期化 (docs 本体は VitePress の locale 機能を使用)
 *
 * - 言語の決定順: ?lang= → localStorage → ブラウザ設定 (en / ja のみ対応)
 * - 右上の言語切替 UI を挿入し、選択を localStorage に保存。docs からは ?lang= 付きのリンクで言語を引き継ぐ
 * - <html lang> と document.title を現在の言語に合わせる
 * - 辞書は { key: [en, ja] } 形式。ja が未定義のキーは警告を出して en にフォールバック
 */
const I18N_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

function initI18n({ dictionary, html = true }) {
  const codes = I18N_LANGUAGES.map((l) => l.code);
  const resources = Object.fromEntries(
    codes.map((code) => [code, { translation: {} }]),
  );
  for (const [key, values] of Object.entries(dictionary)) {
    codes.forEach((code, i) => {
      if (values[i] === undefined) {
        console.warn(`[i18n] missing "${code}" translation: ${key}`);
        return;
      }
      resources[code].translation[key] = values[i];
    });
  }

  const apply = () => {
    const lng = i18next.resolvedLanguage;
    document.documentElement.lang = lng;
    if (i18next.exists("title")) document.title = i18next.t("title");
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const text = i18next.t(el.dataset.i18n);
      if (html) el.innerHTML = text;
      else el.textContent = text;
    }
    for (const el of document.querySelectorAll("[data-i18n-label]")) {
      el.setAttribute("aria-label", i18next.t(el.dataset.i18nLabel));
    }
    for (const button of document.querySelectorAll(".lang-switcher button")) {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lng));
    }
  };

  const setLanguage = async (code) => {
    await i18next.changeLanguage(code);
    // 再読み込み時も選択を維持するため、?lang= を更新する (状態を保つためリロードはしない)
    const url = new URL(location.href);
    url.searchParams.set("lang", code);
    history.replaceState(history.state, "", url);
    apply();
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: code }));
  };

  const mountSwitcher = () => {
    const nav = document.createElement("div");
    nav.className = "lang-switcher";
    nav.setAttribute("role", "group");
    nav.setAttribute("aria-label", "Language");
    for (const { code, label } of I18N_LANGUAGES) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.lang = code;
      button.lang = code;
      button.textContent = label;
      button.addEventListener("click", () => setLanguage(code));
      nav.appendChild(button);
    }
    const style = document.createElement("style");
    style.textContent = `
.lang-switcher{position:fixed;top:8px;right:8px;z-index:1000;display:flex;gap:2px;padding:2px;border-radius:6px;background:rgba(0,0,0,.6);font-size:12px}
.lang-switcher button{padding:4px 10px;border:0;border-radius:4px;background:transparent;color:#fff;font:inherit;cursor:pointer}
.lang-switcher button[aria-pressed="true"]{background:#fff;color:#000}`;
    document.head.appendChild(style);
    document.body.appendChild(nav);
  };

  return i18next
    .use(i18nextBrowserLanguageDetector)
    .init({
      resources,
      supportedLngs: codes,
      nonExplicitSupportedLngs: true,
      fallbackLng: "en",
      debug: false,
      detection: {
        order: ["querystring", "localStorage", "navigator"],
        lookupQuerystring: "lang",
        lookupLocalStorage: "niconicomments-lang",
        caches: ["localStorage"],
      },
    })
    .then(() => {
      mountSwitcher();
      apply();
    });
}
