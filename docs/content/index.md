---
title: はじめに
---

# niconicomments

ニコニコ動画の公式プレイヤーに多少の互換性を持つコメント描画ライブラリです

## リンク

- リポジトリ: <https://github.com/xpadev-net/niconicomments>
- npm: <https://www.npmjs.com/package/@xpadev-net/niconicomments>
- [サンプル](/sample/?lang=ja)

## インストール

NodeJS:

```sh
npm i @xpadev-net/niconicomments
```

Web:

```html
<script src="https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@0.5.0/dist/bundle.js"></script>
```

## 使用例

### HTMLCanvasElementを使用した例

```js
const canvas = document.getElementById("canvas");
const video = document.getElementById("video");
const req = await fetch("sample.json");
const res = await req.json();
const niconiComments = new NiconiComments(canvas, res);
setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
```

### CanvasRendererを使用した例

```js
const canvas = document.getElementById("canvas");
const video = document.getElementById("video");
const req = await fetch("sample.json");
const res = await req.json();
const renderer = new NiconiComments.internal.renderer.CanvasRenderer(canvas);
const niconiComments = new NiconiComments(renderer, res);
setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
```

## このライブラリを使用される方へ

このライブラリを使用するかどうかに関わらず、リアルタイムでコメントを取得、画面を描画、コメントの投稿という一連の流れを実装した場合、ニコニコの特許を侵害する可能性があります

詳しくはこちら[ニコニコが保有する特許について](https://github.com/xpadev-net/niconicomments/blob/master/ABOUT_PATENT.md)を参照してください
