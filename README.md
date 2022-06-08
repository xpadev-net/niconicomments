# [niconicomments](https://xpadev.net/niconicomments/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/xpadev-net/niconicomments/blob/master/LICENSE)  
ニコニコ動画の公式プレイヤー互換の高パフォーマンスなコメント描画ライブラリ   
High peformance High compatibility comment drawing library  
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
[サンプル](https://xpadev.net/niconicomments/sample.html)  
[CodePen](https://codepen.io/xpadev-net/pen/mdBdQmX)  
