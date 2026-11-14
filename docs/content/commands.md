# Custom Commands

niconicomments独自のコマンド

デフォルトでは無効です。利用する場合は[enableCustomCommands](/api#p_enableCustomCommands)を`true`にしてください

## Flash {#c_flash}

### 書式

```
nico:flash
```

自動モード時にFlash版コメントとしての処理を強制します

※HTML5モード時は無視されます

※自動モード時にHTML5版コメントとしての処理を強制させたい場合はdefont、mincho、gothicのいずれかを使用してください

## Stroke Color {#c_stroke}

### 書式

```
nico:stroke:(color|color code)
```

### 例

```
nico:stroke:red
nico:stroke:#f0f
nico:stroke:#fff5
```

コメントの縁取りの色を変更することができます

色の指定は色コマンドまたはカラーコードで行ってください

カラーコードは透明度も指定可能です

## Waku {#c_waku}

### 書式

```
nico:waku:(color|color code)
```

### 例

```
nico:waku:red
nico:waku:#f0f
nico:waku:#fff5
```

コメント単位で枠の表示を制御できます

色の指定は色コマンドまたはカラーコードで行ってください

カラーコードは透明度も指定可能です

## Fill {#c_fill}

### 書式

```
nico:fill:(color|color code)
```

### 例

```
nico:fill:red
nico:fill:#f0f
nico:fill:#fff5
```

コメント単位で背景色の表示を制御できます

色の指定は色コマンドまたはカラーコードで行ってください

カラーコードは透明度も指定可能です

## Opacity {#c_opacity}

### 書式

```
nico:opacity:(0 <= float <= 1)
```

### 例

```
nico:opacity:0
nico:opacity:0.35
nico:opacity:1
```

コメント単位で不透明度を制御できます

1で不透明、0で透明になります

## Scale {#c_scale}

### 書式

```
nico:scale:(0 < float <= 8)
```

### 例

```
nico:scale:0.5
nico:scale:1.5
nico:scale:2
```

コメント単位で拡大率を制御できます

optionsのscale(全体の拡大率)と乗算されます

## Ignore Global Scale {#c_ignore_global_scale}

### 書式

```
nico:ignore-global-scale
```

optionsのscale(全体の拡大率)の適用を対象コメントのみ除外します

nico:scaleと併用した場合、nico:scaleの倍率のみが適用されます
