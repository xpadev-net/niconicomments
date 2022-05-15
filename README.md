# [niconicomments](https://xpadev.net/niconicomments/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/xpadev-net/niconicomments/blob/master/LICENSE)  
ニコニコ動画の公式プレイヤーに多少の互換性を持つコメント描画ライブラリです  
This is a comment drawing library that is somewhat compatible with the official Nico Nico Douga player.  
Reference： https://xpadev-net.github.io/niconicomments/  
Github： https://github.com/xpadev-net/niconicomments  
npm： https://www.npmjs.com/package/@xpadev-net/niconicomments  

## Installation
```html
<script src="https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@latest/dist/bundle.min.js"></script>
```
or
```
npm i @xpadev-net/niconicomments
```

## Examples
```javascript
const canvas = document.getElementById("canvas");
const video = document.getElementById("video");
const req = await fetch("sample.json");
const res = await req.json();
const niconiComments = new NiconiComments(canvas, res);
//video.ontimeupdateを使用すると、呼び出し回数の関係でコメントカクつく
setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
```

## Sample
[レッツゴー！陰陽師](https://xpadev.net/niconicomments/sample.html)  
[レッツゴー！陰陽師(CodePen)](https://codepen.io/xpadev-net/pen/mdBdQmX)  
[ニコニコ動画流星群](https://xpadev.net/niconicomments/ryuuseigun.html)