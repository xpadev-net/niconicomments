---
title: Getting Started
---

# niconicomments

Comment rendering library that is somewhat compatible with the official Nico Nico Douga player

## Links

- Repository: <https://github.com/xpadev-net/niconicomments>
- npm: <https://www.npmjs.com/package/@xpadev-net/niconicomments>
- [Sample](/sample/?lang=en)

## Install

NodeJS:

```sh
npm i @xpadev-net/niconicomments
```

Web:

```html
<script src="https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@0.4.1/dist/bundle.js"></script>
```

## Example

### Using HTMLCanvasElement

```js
const canvas = document.getElementById("canvas");
const video = document.getElementById("video");
const req = await fetch("sample.json");
const res = await req.json();
const niconiComments = new NiconiComments(canvas, res);
setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
```

### Using CanvasRenderer

```js
const canvas = document.getElementById("canvas");
const video = document.getElementById("video");
const req = await fetch("sample.json");
const res = await req.json();
const renderer = new NiconiComments.internal.renderer.CanvasRenderer(canvas);
const niconiComments = new NiconiComments(renderer, res);
setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
```

## For users who use this library for domestic use in Japan

This library may infringe on Dwango's patents depending on how it is used

Please carefully review the following applicable patents and case law before using this library with caution.

- [JP,2006-333851](https://www.j-platpat.inpit.go.jp/c1800/PU/JP-2006-333851/7294651F33633E1EBF3DEC66FAE0ECAD878D19E1829C378FC81D26BBD0A4263B/10/en)
- [JP,2010-267283](https://www.j-platpat.inpit.go.jp/c1800/PU/JP-4734471/9085C128B7ED7D57F6C2F09D9BE4FCB496E638331DB9EC7ADE1E3A44999A3878/15/en)
- [JP,2018-202475](https://www.j-platpat.inpit.go.jp/c1800/PU/JP-6526304/D8AF77CFB92D96C785FEECBD690C53E2F9023F1739E7A5BBDAB588E2ECAC5316/15/en)
- [2018: Case No. Heisei 28 (wa) 38565, Patent Infringement Injunction, etc. Patent Right Civil Litigation](https://www.courts.go.jp/app/files/hanrei_jp/073/088073_hanrei.pdf)
- [2022: Heisei 30 (ne) 10077 Appeal for Patent Infringement Injunction, etc. Patent Right Civil Litigation](https://www.courts.go.jp/app/files/hanrei_jp/418/091418_hanrei.pdf)
