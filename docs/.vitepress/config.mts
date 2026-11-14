import { cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoUrl = "https://github.com/xpadev-net/niconicomments";

/** sample は VitePress 管理外の静的ページなので、SPA 遷移させず通常の遷移にする */
const isStaticPage = (href: string) => /^\/sample\//.test(href);

const sidebar = (prefix: string, labels: { guide: string; api: string; commands: string }) => [
  {
    items: [
      { text: labels.guide, link: `${prefix}/` },
      { text: labels.api, link: `${prefix}/api` },
      { text: labels.commands, link: `${prefix}/commands` },
    ],
  },
];

const themeFor = (prefix: "" | "/en", lang: "ja" | "en") => {
  const ja = lang === "ja";
  return {
    nav: [
      { text: ja ? "はじめに" : "Getting Started", link: `${prefix}/`, activeMatch: `^${prefix}/$` },
      { text: "API", link: `${prefix}/api` },
      { text: "Custom Commands", link: `${prefix}/commands` },
      { text: ja ? "サンプル" : "Sample", link: `/sample/?lang=${lang}`, target: "_self" },
    ],
    sidebar: sidebar(prefix, {
      guide: ja ? "はじめに" : "Getting Started",
      api: "API",
      commands: "Custom Commands",
    }),
    outline: { level: [2, 4], label: ja ? "このページの内容" : "On this page" },
  } as const;
};

export default defineConfig({
  srcDir: "content",
  base: "/niconicomments/",
  cleanUrls: true,
  title: "niconicomments",
  // sample は別途ビルド後にコピーするため、リンク切れ判定から除外する
  ignoreDeadLinks: [/^\/sample\//],
  lastUpdated: false,
  head: [["link", { rel: "icon", href: "data:," }]],
  locales: {
    root: {
      label: "日本語",
      lang: "ja",
      description: "ニコニコ動画の公式プレイヤーに多少の互換性を持つコメント描画ライブラリ",
      themeConfig: themeFor("", "ja"),
    },
    en: {
      label: "English",
      lang: "en",
      link: "/en/",
      description:
        "Comment rendering library that is somewhat compatible with the official Nico Nico Douga player",
      themeConfig: themeFor("/en", "en"),
    },
  },
  themeConfig: {
    socialLinks: [{ icon: "github", link: repoUrl }],
    search: { provider: "local" },
  },
  markdown: {
    config(md) {
      const defaultRender =
        md.renderer.rules.link_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const href = tokens[idx].attrGet("href") ?? "";
        if (isStaticPage(href)) tokens[idx].attrSet("target", "_self");
        return defaultRender(tokens, idx, options, env, self);
      };
    },
  },
  async buildEnd(siteConfig) {
    // VitePress のビルド成果物へ sample と bundle を統合する
    const out = siteConfig.outDir;
    const repoRoot = resolve(docsDir, "..");
    for (const [from, to] of [
      [resolve(docsDir, "sample"), "sample"],
    ] as const) {
      if (existsSync(from)) cpSync(from, resolve(out, to), { recursive: true });
      else console.warn(`[docs] skipped (not found): ${from}`);
    }
    const bundle = resolve(repoRoot, "dist/bundle.js");
    if (existsSync(bundle)) cpSync(bundle, resolve(out, "bundle.js"));
    else console.warn("[docs] dist/bundle.js not found; run `pnpm build` first");
  },
});
