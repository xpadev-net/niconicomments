const localize = {
  for_user: [
    `<h3>For users who use this library for domestic use in Japan</h3>
<p>This library may infringe on Dwango's patents depending on how it is used</p>
<p>Please carefully review the following applicable patents and case law before using this library with caution.</p>
<p><a href='https://www.j-platpat.inpit.go.jp/c1800/PU/JP-2006-333851/7294651F33633E1EBF3DEC66FAE0ECAD878D19E1829C378FC81D26BBD0A4263B/10/en'>JP,2006-333851</a></p>
<p><a href='https://www.j-platpat.inpit.go.jp/c1800/PU/JP-4734471/9085C128B7ED7D57F6C2F09D9BE4FCB496E638331DB9EC7ADE1E3A44999A3878/15/en'>JP,2010-267283</a></p>
<p><a href='https://www.j-platpat.inpit.go.jp/c1800/PU/JP-6526304/D8AF77CFB92D96C785FEECBD690C53E2F9023F1739E7A5BBDAB588E2ECAC5316/15/en'>JP,2018-202475</a></p>
<p><a href='https://www.courts.go.jp/app/files/hanrei_jp/073/088073_hanrei.pdf'>2018: Case No. Heisei 28 (wa) 38565, Patent Infringement Injunction, etc. Patent Right Civil Litigation</a></p>
<p><a href='https://www.courts.go.jp/app/files/hanrei_jp/418/091418_hanrei.pdf'>2022: Heisei 30 (ne) 10077 Appeal for Patent Infringement Injunction, etc. Patent Right Civil Litigation</a></p>`,
    `<h3>このライブラリを使用される方へ</h3>
<p>このライブラリを使用するかどうかに関わらず、リアルタイムでコメントを取得、画面を描画、コメントの投稿という一連の流れを実装した場合、ニコニコの特許を侵害する可能性があります</p>
<p>詳しくはこちら<a href="https://github.com/xpadev-net/niconicomments/blob/master/ABOUT_PATENT.md">ニコニコが保有する特許について</a>を参照してください</p>`,
  ],
  about_desc: [
    "Comment rendering library that is somewhat compatible with the official Nico Nico Douga player",
    "ニコニコ動画の公式プレイヤーに多少の互換性を持つコメント描画ライブラリです",
  ],
  about_docs: ["Document: ", "ドキュメント: "],
  about_repo: ["Repository: ", "リポジトリ: "],
  sample: ["sample", "サンプル"],
  class_main: ["The main body of this library.", "このライブラリの本体です"],
  p_canvas: [
    `<p>Pass a Canvas Element for comment drawing</p>
<p>This library assumes that the canvas size is 1920x1080.</p>
<p>If the size is incorrectly set, the comment will not be drawn correctly.</p>`,
    `<p>コメント描画用のキャンバスElementを渡してください</p>
<p>このライブラリはキャンバスサイズが1920x1080である前提で描画を行います</p>
<p>サイズ設定をミスるとコメントが正常に描画されません</p>`,
  ],
  p_data: [
    `<p>Please pass comment data or undefined.</p>
<p>Please check the <a href="#p_format">format</a> for supported formats.</p>`,
    `<p>コメントデータまたはundefinedを渡してください</p>
<p>対応フォーマットは<a href="#p_format">format</a>を確認してください</p>`,
  ],
  p_config: [
    `<p><span class="warn">It is recommended not to change this option. It may cause drawing corruption.</span></p>
<p>You can override the magic number for internal processing</p>
<p>See the defaultConfig comment in <a href="https://github.com/xpadev-net/niconicomments/blob/master/src/definition/config.ts">src/definition/config.ts</a> for details on each variable</p>`,
    `<p><span class="warn">このオプションは弄らないことを推奨します。描画が崩れる場合があります</span></p>
<p>内部処理用のマジックナンバーを上書きすることができます</p>
<p>各変数の詳細は<a href="https://github.com/xpadev-net/niconicomments/blob/master/src/definition/config.ts">src/definition/config.ts</a>内のdefaultConfigのコメントを参照してください</p>`,
  ],
  p_debug: [
    `<p>Outputs the time required for processing to the browser console</p>
<p>It also displays the command applied in the upper left corner of each comment.</p>
<p>No output by default (<span class="yellow">false</span>)</p>`,
    `<p>処理の所要時間をブラウザコンソールに出力します</p>
<p>また、各コメントの左上に適用されているコマンドを表示します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は出力を行いません</p>`,
  ],
  p_enableLegacyPiP: [
    `<p><span class="note">This option is effective immediately</span></p>
<p>Change Picture in Picture output mode</p>
<p>The default (<span class="yellow">false</span>) is to draw the video so that it covers the entire screen</p>
<p>If <span class="yellow">true</span>, the video will be drawn so that it fits entirely within the screen</p>`,
    `<p><span class="note">初期化後も随時設定の変更が可能です</span></p>
<p>PiPの出力形式を変更します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は画面全体を覆うように動画を描画します</p>
<p><span class="yellow">true</span>の場合は画面内に全体が収まるように動画を描画します</p>`,
  ],
  p_format: [
    `<p>Specify input format</p>
<p>Supported formats are as follows</p>
<table><thead><tr><th>Name</th><th>Type</th><th>Note</th></tr></thead>
  <tbody>
    <tr>
      <td>empty</td>
      <td class="type">undefined</td>
      <td>For dynamic additional comments</td>
    </tr>
    <tr>
      <td>XMLDocument</td>
      <td class="type">XMLDocument</td>
      <td>Pass XML parseFromString with DOMParser</td>
    </tr>
    <tr>
        <td>formatted</td>
        <td class="type"><a href="./type/types/_types_format_formatted.formattedComment.html">formattedComment</a>[] |<a href="./type/types/_types_format_formatted.formattedLegacyComment.html">formattedLegacyComment</a>[]</td>
        <td>If user_id and layer are not included, it will be formattedLegacyComment</td>
    </tr>
    <tr>
      <td>legacy</td>
      <td class="type"><a href="./type/types/_types_format_legacy.rawApiResponse.html">rawApiResponse</a>[]</td>
      <td>Pass the legacy api response with JSON.parse</td>
    </tr>
    <tr>
      <td>owner</td>
      <td class="type"><a href="./type/types/_types_format_owner.ownerComment.html">ownerComment</a>[]</td>
      <td>Please JSON.parase and pass the json of the editor on the owner comment edit screen</td>
    </tr>
    <tr>
      <td>legacyOwner</td>
      <td class="type">string</td>
      <td>Please pass the editor's string (including line breaks) from the old owner's comment edit screen as a string</td>
    </tr>
    <tr>
      <td>v1</td>
      <td class="type"><a href="./type/types/_types_format_v1.v1Thread.html">v1Thread</a>[]</td>
      <td>Pass the contents of the threads under data in the v1 api</td>
    </tr>
  </tbody>
</table>`,
    `<p>入力フォーマットを指定します</p>
<p>対応しているフォーマットは以下のとおりです</p>
<table>
  <thead><tr><th>名前</th><th>dataのtype</th><th>備考</th></tr></thead>
  <tbody>
    <tr>
      <td>empty</td>
      <td class="type">undefined</td>
      <td>動的追加コメント用</td>
    </tr>
    <tr>
      <td>XMLDocument</td>
      <td class="type">XMLDocument</td>
      <td>saccubusやniconicome等が生成したXMLをDOMParserでparseFromStringしたものを渡してください<br>後方互換のためフォーマット名「niconicome」もサポートしていますが、今後予告なく実装から削除される場合があります</td>
    </tr>
    <tr>
      <td>formatted</td>
      <td class="type"><a href="./type/types/_types_format_formatted.formattedComment.html">formattedComment</a>[] |<a href="./type/types/_types_format_formatted.formattedLegacyComment.html">formattedLegacyComment</a>[]</td>
      <td>user_idとlayerが含まれない場合はformattedLegacyCommentになります</td>
    </tr>
    <tr>
      <td>legacy</td>
      <td class="type"><a href="./type/types/_types_format_legacy.rawApiResponse.html">rawApiResponse</a>[]</td>
      <td>legacy apiのレスポンスをJSON.parseしたものを渡してください</td>
    </tr>
    <tr>
      <td>owner</td>
      <td class="type"><a href="./type/types/_types_format_owner.ownerComment.html">ownerComment</a>[]</td>
      <td>投稿者コメント編集画面のエディータのjsonをJSON.parseしたものを渡してください</td>
    </tr>
    <tr>
      <td>legacyOwner</td>
      <td class="type">string</td>
      <td>旧投稿者コメント編集画面のエディータの文字列(改行含む)をそのまま渡してください</td>
    </tr>
    <tr>
      <td>v1</td>
      <td class="type"><a href="./type/types/_types_format_v1.v1Thread.html">v1Thread</a>[]</td>
      <td>v1 apiのdata以下threadsの内容を渡してください</td>
    </tr>
  </tbody>
</table>`,
  ],
  p_formatted: [
    `<p><span class="warn">This option is deprecated. Use the <a href="#p_format">format</a> option</span></p>
<p>Specifies whether the comment data is in a proprietary format</p>
<p>If default (<span class="yellow">false</span>), the data is converted to the original format before processing</p>
<p>If <span class="yellow">true</span>, processing is performed as is.</p>`,
    `<p><span class="warn">このオプションは非推奨です。<a href="#p_format">format</a>オプションを使用してください</span></p>
<p>コメントデータが独自フォーマットかを指定します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は独自フォーマットに変換を行ってから処理を行います</p>
<p><span class="yellow">true</span>の場合はそのまま処理を行います</p>`,
  ],
  p_keepCA: [
    `<p>Suppresses the collapse of comment arts (mainly stacked comments) by another CA or by irrelevant comments.</p>
<p>If default (<span class="yellow">false</span>), positioning is done as usual</p>
<p>If <span class="yellow">true</span>, the layer of the user who is presumed to have posted the CA will be positioned separately.</p>
<p>It also has the effect of suppressing the scaling of the corresponding CA.</p>`,
    `<p>別のCAや関係ないコメントによってCA(主に積み絵)が崩壊するのを抑制します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は通常通り位置決定を行います</p>
<p><span class="yellow">true</span>の場合はCAを投稿していると推定されるユーザーのレイヤーを分けて位置決定をおこないます</p>
<p>また、該当CAの拡大縮小を抑制する効果もあります</p>`,
  ],
  p_mode: [
    `<p>Specifies the drawing mode</p>
<p>The default (<span class="green">"default"</span>) is to automatically switch the mode of operation for each comment based on the posting time.</p>
<p><span class="green">"html5"</span> will work similar to the current html5 player</p>
<p><span class="green">"flash"</span> will work similar to Flash era compatible players such as Saccubus/ZenzaWatch.</p>
<p>In the case of <span class="green">"default"</span> or <span class="green">"flash"</span>, it partially supports font-changing characters and split comments from the Flash player.</p>`,
    `<p>描画モードを指定します</p>
<p>デフォルト(<span class="green">"default"</span>)の場合は投稿時間をもとにコメントごとに動作モードを自動で切り替えます</p>
<p><span class="green">"html5"</span>の場合は、現行のhtml5プレイヤーに近い動作をします</p>
<p><span class="green">"flash"</span>の場合は、Saccubus/ZenzaWatchなどFlash時代の互換プレイヤーに近い動作をします</p>
<p><span class="green">"default"</span>または<span class="green">"flash"</span>の場合はFlashプレイヤー当時のフォント変化文字や分割コメントなどを部分的にサポートします</p>`,
  ],
  p_scale: [
    `<p>Scale up or down the display comment size</p>
<p>It is recommended to use <a href="#p_keepCA">keepCA</a> together</p>`,
    `<p>表示コメントサイズを拡大縮小します</p>
<p><a href="#p_keepCA">keepCA</a>を併用することを推奨します</p>`,
  ],
  p_showCollision: [
    `<p><span class="note">This option is effective immediately</span></p>
<p>Specifies whether or not to draw the hit judgment of the comment.</p>
<p>Defaults (<span class="yellow">false</span>) to no drawing</p>
<p>If <span class="yellow">true</span>, the comment hit detection and the line separator are drawn.</p>
<p>The color of the outer border changes to light blue for HTML5 comments and purple for Flash comments.</p>`,
    `<p><span class="note">初期化後も随時設定の変更が可能です</span></p>
<p>コメントの当たり判定を描画するか指定します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は描画を行いません</p>
<p><span class="yellow">true</span>の場合は、コメントの当たり判定と行の区切りを描画します</p>
<p>HTML5版のコメントは水色に、Flash版のコメントは紫に外枠線の色が変化します</p>`,
  ],
  p_showCommentCount: [
    `<p><span class="note">This option is effective immediately</span></p>
<p>Specifies whether the number of comments being drawn should be drawn on the screen.</p>
<p>Defaults (<span class="yellow">false</span>) to no drawing</p>
<p>If <span class="yellow">true</span>, the total number of comments drawn on the screen is drawn.、画面内に描画されているコメントの総数を描画します</p>`,
    `<p><span class="note">初期化後も随時設定の変更が可能です</span></p>
<p>描画されているコメント数を画面上に描画するか指定します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は描画を行いません</p>
<p><span class="yellow">true</span>の場合は、画面内に描画されているコメントの総数を描画します</p>`,
  ],
  p_showFPS: [
    `<p><span class="note">This option is effective immediately</span></p>
<p>Specifies whether the FPS is drawn on the screen.</p>
<p>Defaults (<span class="yellow">false</span>) to no drawing</p>
<p>If <span class="yellow">true</span>, FPS is displayed.</p>
<p>※This value is calculated based on the time it takes to draw a frame, so it is different from the actual number of frames drawn.</p>`,
    `<p><span class="note">初期化後も随時設定の変更が可能です</span></p>
<p>FPSを画面上に描画するか指定します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は描画を行いません</p>
<p><span class="yellow">true</span>の場合は、FPSを表示します</p>
<p>※この値はフレームを描画するのにかかった時間をもとに算出しているため、実際に描画されたフレーム数とは異なります</p>`,
  ],
  p_useLegacy: [
    `<p><span class="warn">This option is deprecated. use the <a href="#p_mode">mode</a> option</span></p>
<p>Specifies whether official player compatibility mode is enabled</p>
<p>If the default (<span class="yellow">false</span>), the drawing mode is automatically switched for each comment</p>
<p>If <span class="yellow">true</span>, all comments are rendered as HTML5 comments</p>`,
    `<p><span class="warn">このオプションは非推奨です。<a href="#p_mode">mode</a>オプションを使用してください</span></p>
<p>公式プレイヤー互換モードを有効にするか指定します</p>
<p>デフォルト(<span class="yellow">false</span>)の場合は描画モードがコメントごとに自動で切り替わります</p>
<p><span class="yellow">true</span>の場合は全コメントをHTML5版のコメントとして処理します</p>`,
  ],
  p_video: [
    `<p><span class="note">This option is effective immediately</span></p>
<p>Specifies the video to be drawn in the background.</p>
<p>If default (<span class="yellow">null</span>), no video is drawn.</p>
<p>If specified, the specified video is drawn in the background and the comment is drawn on top of it.</p>
<p>By applying this function, you can also display comments on Picture in Picture.</p>`,
    `<p><span class="note">初期化後も随時設定の変更が可能です</span></p>
<p>背景に描画する動画を指定します</p>
<p>デフォルト(<span class="yellow">null</span>)の場合は描画を行いません</p>
<p>指定されている場合は、背景に指定された動画を描画し、その上にコメントを描画します</p>
<p>この機能を応用すると、Picture in Pictureにもコメントを表示できるようになります</p>`,
  ],
  m_addComments: [
    `<p>This is a feature to dynamically add comments, mainly for live broadcasts.</p>
<p>Comments added by this feature are placed based on a hit decision, but do not affect the position of subsequent comments that have already been placed.</p>
<p>Comments may overlap with each other when placed between already generated comments.</p>`,
    `<p>主に生配信向けの、コメントを動的に追加する機能です</p>
<p>この機能によって追加されたコメントは当たり判定を考慮して配置されますが、すでに配置されているその後のコメントの位置には影響を及ぼしません</p>
<p>生成済みのコメントの間に配置した場合、コメント同士が重複する場合があります</p>`,
  ],
  m_addEventListener: [
    `<p>Add an event handler</p>
<p>Check the type definition for event details</p>`,
    `<p>イベントハンドラを追加します</p>
<p>イベントの詳細は型定義を確認してください</p>`,
  ],
  m_removeEventListener: [
    `<p>Remove an event handler</p>
<p>Check the type definition for event details</p>`,
    `<p>addEventListenerで追加されたイベントハンドラを削除します</p>`,
  ],
  m_drawCanvas: [
    `<p>Draws a comment on the canvas based on vpos(currentTime*100 of the video)</p>
<p>vpos must be an integer (<span class="yellow">int</span>)</p>`,
    `<p>vpos(動画のcurrentTime*100)を元にキャンバスにコメントを描画します</p>
<p>vposは<span class="yellow">整数(int)</span>である必要があります</p>`,
  ],
  m_clear: [`<p>Erase Canvas</p>`, `<p>キャンバスを消去します</p>`],
  c_flash: [
    `<p>Enforces processing as a Flash version comment when in auto mode</p>
<p>※This command is ignored except in auto mode</p>
<p>※If you want to force processing as HTML5 version comments in auto mode, use one of the following commands: defont, mincho, or gothic</p>`,
    `<p>自動モード時にFlash版コメントとしての処理を強制します</p>
<p>※HTML5モード時は無視されます</p>
<p>※自動モード時にHTML5版コメントとしての処理を強制させたい場合はdefont、mincho、gothicのいずれかを使用してください</p>`,
  ],
  c_stroke: [
    `<p>This command allows you to change the color of the comment borders</p>
<p>Colors can be specified with the color command or color code</p>
<p>Color code can also specify transparency</p>`,
    `<p>コメントの縁取りの色を変更することができます</p>
<p>色の指定は色コマンドまたはカラーコードで行ってください</p>
<p>カラーコードは透明度も指定可能です</p>`,
  ],
  c_waku: [
    `<p>You can control the display of frames per comment.</p>
<p>Colors can be specified with the color command or color code</p>
<p>Color code can also specify transparency</p>`,
    `<p>コメント単位で枠の表示を制御できます</p>
<p>色の指定は色コマンドまたはカラーコードで行ってください</p>
<p>カラーコードは透明度も指定可能です</p>`
  ]
};
const resources = { en: { translation: {} }, ja: { translation: {} } };
for (const key in localize) {
  resources.en.translation[key] = localize[key][0];
  resources.ja.translation[key] = localize[key][1];
}
i18next.use(i18nextBrowserLanguageDetector).init({
  fallbackLng: "en",
  debug: false,
  resources: resources,
});
const i18nList = document.querySelectorAll("[data-i18n]");
i18nList.forEach(function (v) {
  v.innerHTML = i18next.t(v.dataset.i18n);
});
