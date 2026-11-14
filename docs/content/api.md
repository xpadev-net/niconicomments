# API

## NiconiComments {#NiconiComments}

class NiconiComments(canvas:HTMLCanvasElement | [IRenderer](/type/interfaces/_types_renderer.IRenderer.html), data:[inputFormat](/type/types/_types_options.inputFormat.html), options:[InitOptions](/type/modules/_types_types.html#InitOptions))

このライブラリの本体です

### パラメータ {#Parameters}

#### canvas {#p_canvas}

canvas:HTMLCanvasElement | [IRenderer](/type/interfaces/_types_renderer.IRenderer.html)

コメント描画用のCanvasElementか、 [IRenderer](/type/interfaces/_types_renderer.IRenderer.html) に適合するクラス、オブジェクトなどを渡してください

デフォルトで使用される [CanvasRender](/type/classes/renderer_canvas.CanvasRenderer.html) は NiconiComments.internal.renderer.CanvasRenderer から使用することができます

コメントのレイアウトは1920x1080(16:9)のステージを基準とし、キャンバスの高さがステージの高さに一致するように拡大縮小されます

キャンバスのアスペクト比は16:9でなくても構いません。表示範囲はキャンバスのアスペクト比で決まり、ステージは常に中央に配置されます

-   16:9より横長の場合: 表示範囲が左右に広がり、流れるコメントは広がった範囲にも描画されます
-   16:9より縦長の場合: ステージの左右が切り取られます

`canvas.width` / `canvas.height`を直接変更しても検知されません。初期化後にサイズを変更する場合は、[CanvasRenderer](/type/classes/renderer_canvas.CanvasRenderer.html)などのレンダラーを渡し、[drawCanvas](#m_drawCanvas)を呼び出す前にそのレンダラーの`setSize(width, height)`を呼び出してください

#### data {#p_data}

data:[inputFormat](/type/types/_types_options.inputFormat.html)

コメントデータまたはundefinedを渡してください

対応フォーマットは[format](#p_format)を確認してください

#### options {#p_options}

options:[InitOptions](/type/types/_types_options.InitOptions.html)

##### config {#p_config}

config[:Config](/type/types/_types_config.Config.html) = {}

::: warning
このオプションは弄らないことを推奨します。描画が崩れる場合があります
:::

内部処理用のマジックナンバーを上書きすることができます

各変数の詳細は[src/definition/config.ts](https://github.com/xpadev-net/niconicomments/blob/master/src/definition/config.ts)内のdefaultConfigのコメントを参照してください

##### debug {#p_debug}

debug:boolean = `false`

処理の所要時間をブラウザコンソールに出力します

また、各コメントの左上に適用されているコマンドを表示します

デフォルト(`false`)の場合は出力を行いません

##### enableCustomCommands {#p_enableCustomCommands}

enableCustomCommands:boolean = `false`

niconicomments独自のコマンド(`nico:*`)を有効にするかを指定します

デフォルト(`false`)の場合、`nico:*`形式のコマンドはすべて無視されます

`true`の場合、[Custom Commands](/commands)に記載されているコマンドが有効になります

##### enableLegacyPiP {#p_enableLegacyPiP}

enableLegacyPiP:boolean = `false`

初期化後も随時設定の変更が可能です

PiPの出力形式を変更します

デフォルト(`false`)の場合は画面全体を覆うように動画を描画します

`true`の場合は画面内に全体が収まるように動画を描画します

##### format {#p_format}

format:[inputFormatType](/type/modules/_types_types.html#inputFormatType) = `"legacy"`

入力フォーマットを指定します

対応しているフォーマットは以下のとおりです

| 名前 | dataのtype | 備考 |
| --- | --- | --- |
| empty | undefined | 動的追加コメント用 |
| XMLDocument | XMLDocument | saccubusやniconicome等が生成したXMLをDOMParserでparseFromStringしたものを渡してください  
後方互換のためフォーマット名「niconicome」もサポートしていますが、今後予告なく実装から削除される場合があります |
| xml2js | [Xml2jsPacket](/type/types/_types_format_xml2js.Xml2jsPacket.html) | xml形式のコメントをxml2jsでパースしたオブジェクトを渡してください |
| formatted | [formattedComment](/type/types/_types_format_formatted.formattedComment.html)\[\] \| [formattedLegacyComment](/type/types/_types_format_formatted.formattedLegacyComment.html)\[\] | user_idとlayerが含まれない場合はformattedLegacyCommentになります |
| legacy | [rawApiResponse](/type/types/_types_format_legacy.rawApiResponse.html)\[\] | legacy apiのレスポンスをJSON.parseしたものを渡してください |
| owner | [ownerComment](/type/types/_types_format_owner.ownerComment.html)\[\] | 投稿者コメント編集画面のエディータのjsonをJSON.parseしたものを渡してください |
| legacyOwner | string | 旧投稿者コメント編集画面のエディータの文字列(改行含む)をそのまま渡してください |
| v1 | [v1Thread](/type/types/_types_format_v1.v1Thread.html)\[\] | v1 apiのdata以下threadsの内容を渡してください |

##### formatted {#p_formatted}

formatted:boolean = `false`

::: warning
このオプションは非推奨です。[format](#p_format)オプションを使用してください
:::

コメントデータが独自フォーマットかを指定します

デフォルト(`false`)の場合は独自フォーマットに変換を行ってから処理を行います

`true`の場合はそのまま処理を行います

##### keepCA {#p_keepCA}

keepCA:boolean = `false`

別のCAや関係ないコメントによってCA(主に積み絵)が崩壊するのを抑制します

デフォルト(`false`)の場合は通常通り位置決定を行います

`true`の場合はCAを投稿していると推定されるユーザーのレイヤーを分けて位置決定をおこないます

また、該当CAの拡大縮小を抑制する効果もあります

##### mode {#p_mode}

mode[:modeType](/type/types/_types_options.modeType.html) = `"default"`

描画モードを指定します

デフォルト(`"default"`)の場合は投稿時間をもとにコメントごとに動作モードを自動で切り替えます

`"html5"`の場合は、現行のhtml5プレイヤーに近い動作をします

`"flash"`の場合は、Saccubus/ZenzaWatchなどFlash時代の互換プレイヤーに近い動作をします

`"default"`または`"flash"`の場合はFlashプレイヤー当時のフォント変化文字や分割コメントなどを部分的にサポートします

##### scale {#p_scale}

scale:number = `1`

表示コメントサイズを拡大縮小します

[keepCA](#p_keepCA)を併用することを推奨します

##### showCollision {#p_showCollision}

showCollision:boolean = `false`

初期化後も随時設定の変更が可能です

コメントの当たり判定を描画するか指定します

デフォルト(`false`)の場合は描画を行いません

`true`の場合は、コメントの当たり判定と行の区切りを描画します

HTML5版のコメントは水色に、Flash版のコメントは紫に外枠線の色が変化します

##### showCommentCount {#p_showCommentCount}

showCommentCount:boolean = `false`

初期化後も随時設定の変更が可能です

描画されているコメント数を画面上に描画するか指定します

デフォルト(`false`)の場合は描画を行いません

`true`の場合は、画面内に描画されているコメントの総数を描画します

##### showFPS {#p_showFPS}

showFPS:boolean = `false`

初期化後も随時設定の変更が可能です

FPSを画面上に描画するか指定します

デフォルト(`false`)の場合は描画を行いません

`true`の場合は、FPSを表示します

※この値はフレームを描画するのにかかった時間をもとに算出しているため、実際に描画されたフレーム数とは異なります

##### useLegacy {#p_useLegacy}

useLegacy:boolean = `false`

::: warning
このオプションは非推奨です。[mode](#p_mode)オプションを使用してください
:::

公式プレイヤー互換モードを有効にするか指定します

デフォルト(`false`)の場合は描画モードがコメントごとに自動で切り替わります

`true`の場合は全コメントをHTML5版のコメントとして処理します

##### video {#p_video}

video:HTMLVideoElement | null = `null`

初期化後も随時設定の変更が可能です

IRenderer に適合するオブジェクトまたはクラスを使用している場合は IRenderer の video プロパティに VideoElement をセットしてください  
CanvasRenderer を使用している場合は第二引数に VideoElement を渡してください

背景に描画する動画を指定します

デフォルト(`null`)の場合は描画を行いません

指定されている場合は、背景に指定された動画を描画し、その上にコメントを描画します

この機能を応用すると、Picture in Pictureにもコメントを表示できるようになります

### メソッド {#Methods}

#### addComments() {#m_addComments}

addComments(...comments[:formattedComment](/type/types/_types_format_formatted.formattedComment.html)):void

主に生配信向けの、コメントを動的に追加する機能です

この機能によって追加されたコメントは当たり判定を考慮して配置されますが、すでに配置されているその後のコメントの位置には影響を及ぼしません

生成済みのコメントの間に配置した場合、コメント同士が重複する場合があります

#### addEventListener() {#m_addEventListener}

addEventListener(eventName[:CommentEventName](/type/types/_types_event.CommentEventName.html), eventHandler[:CommentEventHandler](/type/interfaces/_types_event.CommentEventHandlerMap.html)):void

イベントハンドラを追加します

イベントの詳細は型定義を確認してください

#### removeEventListener() {#m_removeEventListener}

removeEventListener(eventName[:CommentEventName](/type/types/_types_event.CommentEventName.html), eventHandler[:CommentEventHandler](/type/interfaces/_types_event.CommentEventHandlerMap.html)):void

addEventListenerで追加されたイベントハンドラを削除します

#### drawCanvas() {#m_drawCanvas}

drawCanvas(vpos:number):void

vpos(動画のcurrentTime\*100)を元にキャンバスにコメントを描画します

#### clear() {#m_clear}

clear():void

キャンバスを消去します
