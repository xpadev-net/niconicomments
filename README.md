# [niconicomments](https://xpadev.net/niconicomments/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/xpadev-net/niconicomments/blob/master/LICENSE)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/xpadev-net/niconicomments.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/xpadev-net/niconicomments/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/xpadev-net/niconicomments.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/xpadev-net/niconicomments/context:javascript)

ニコニコ動画の公式プレイヤー互換の高パフォーマンスなコメント描画ライブラリ   
High peformance High compatibility comment drawing library  
Reference： https://xpadev-net.github.io/niconicomments/  
Github： https://github.com/xpadev-net/niconicomments  
npm： https://www.npmjs.com/package/@xpadev-net/niconicomments

## [重要]このライブラリを使用される方へ
ニコニコ運営が画面にコメントを流すアドオンを特許侵害だと騒ぎ立てて潰して回っているようです  
このライブラリ本体は描画部分のみのため特許侵害に当たるとは考えていませんが、ニコニコ動画運営(とその近辺の人)に叩かれる可能性があります  
(名前は出しませんがすでにいくつかのOSSに被害が出ています)  
また、このライブラリを使用するかどうかに関わらず、リアルタイムでコメントを取得、画面を描画、コメントの投稿という一連の流れを実装した場合、ニコニコの特許を侵害する可能性があります  
詳しくはこちら[ニコニコが保有する特許について](https://github.com/xpadev-net/niconicomments/blob/develop/ABOUT_PATENT.md)を参照してください  
**※当ライブラリを削除する予定は一切ありません**

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
[サンプル](https://xpadev-net.github.io/niconicomments/sample/)  
[CodePen](https://codepen.io/xpadev-net/pen/mdBdQmX)  
