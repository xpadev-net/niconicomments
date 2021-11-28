# [niconicomments](https://xpadev.net/niconicomments/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/xpadev_net/niconicomments/LICENSE)  
ニコニコ動画の公式プレイヤーに多少の互換性を持つコメント描画ライブラリです  
This is a comment drawing library that is somewhat compatible with the official Nico Nico Douga player.  
Reference： https://xpadev.net/niconicomments/docs/  
Github： https://github.com/xpadev-net/niconicomments  

## Installation
```html
<script src="https://cdn.jsdelivr.net/npm/niconicomments/src/main.min.js"></script>
```
または
```
npm install niconicomments
```

## Examples
```javascript
const niconiComments = new NiconiComments(canvas, comments);
niconiComments.drawCanvas(vpos)
```

## Sample
https://xpadev.net/niconicomments/sample.html