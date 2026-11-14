# API

## NiconiComments {#NiconiComments}

class NiconiComments(canvas:HTMLCanvasElement | IRenderer, data:inputFormat, options:InitOptions)

The main body of this library.

### Parameters {#Parameters}

#### canvas {#p_canvas}

canvas:HTMLCanvasElement | IRenderer

Pass a class or object conforming to IRenderer or Canvas Element for comment drawing

CanvasRender used by default can be used from NiconiComments.internal.renderer.CanvasRenderer

The comment layout is based on a 1920x1080 (16:9) stage, and the canvas is scaled so that its height matches the stage height.

The canvas does not have to be 16:9. The visible area is determined by the canvas aspect ratio, and the stage is always centered.

-   Wider than 16:9: the visible area extends horizontally, and moving comments are also drawn in the extended area
-   Narrower than 16:9: both sides of the stage are cropped

Changing `canvas.width` / `canvas.height` directly is not detected. To change the size after initialization, pass a renderer such as CanvasRenderer and call its `setSize(width, height)` before calling [drawCanvas](#m_drawCanvas).

#### data {#p_data}

data:inputFormat

Please pass comment data or undefined.

Please check the [format](#p_format) for supported formats.

#### options {#p_options}

options:InitOptions

##### config {#p_config}

config:Config = {}

::: warning
It is recommended not to change this option. It may cause drawing corruption.
:::

You can override the magic number for internal processing

See the defaultConfig comment in [src/definition/config.ts](https://github.com/xpadev-net/niconicomments/blob/master/src/definition/config.ts) for details on each variable

##### debug {#p_debug}

debug:boolean = `false`

Outputs the time required for processing to the browser console

It also displays the command applied in the upper left corner of each comment.

No output by default (`false`)

##### enableCustomCommands {#p_enableCustomCommands}

enableCustomCommands:boolean = `false`

Specifies whether to enable niconicomments' own commands (`nico:*`)

The default (`false`) ignores all `nico:*` commands

If `true`, the commands described in [Custom Commands](/en/commands) are enabled

##### enableLegacyPiP {#p_enableLegacyPiP}

enableLegacyPiP:boolean = `false`

This option is effective immediately

Change Picture in Picture output mode

The default (`false`) is to draw the video so that it covers the entire screen

If `true`, the video will be drawn so that it fits entirely within the screen

##### format {#p_format}

format:inputFormatType = `"default"`

Specify input format

Supported formats are as follows

| Name | Type | Note |
| --- | --- | --- |
| default | legacy \| formatted | Default. Treated as formatted if the deprecated `formatted` option is `true`, otherwise as legacy |
| empty | undefined | For dynamic additional comments |
| XMLDocument | XMLDocument | Pass XML parseFromString with DOMParser |
| xml2js | Xml2jsPacket | Pass object parsed with xml2js |
| formatted | formattedComment\[\] \| formattedLegacyComment\[\] | If user_id and layer are not included, it will be formattedLegacyComment |
| legacy | rawApiResponse\[\] | Pass the legacy api response with JSON.parse |
| owner | ownerComment\[\] | Please JSON.parase and pass the json of the editor on the owner comment edit screen |
| legacyOwner | string | Please pass the editor's string (including line breaks) from the old owner's comment edit screen as a string |
| v1 | v1Thread\[\] | Pass the contents of the threads under data in the v1 api |

##### formatted {#p_formatted}

formatted:boolean = `false`

::: warning
This option is deprecated. Use the [format](#p_format) option
:::

Specifies whether the comment data is in a proprietary format

If default (`false`), the data is converted to the original format before processing

If `true`, processing is performed as is.

##### keepCA {#p_keepCA}

keepCA:boolean = `false`

Suppresses the collapse of comment arts (mainly stacked comments) by another CA or by irrelevant comments.

If default (`false`), positioning is done as usual

If `true`, the layer of the user who is presumed to have posted the CA will be positioned separately.

It also has the effect of suppressing the scaling of the corresponding CA.

##### mode {#p_mode}

mode:modeType = `"default"`

Specifies the drawing mode

The default (`"default"`) is to automatically switch the mode of operation for each comment based on the posting time.

`"html5"` will work similar to the current html5 player

`"flash"` will work similar to Flash era compatible players such as Saccubus/ZenzaWatch.

In the case of `"default"` or `"flash"`, it partially supports font-changing characters and split comments from the Flash player.

##### scale {#p_scale}

scale:number = `1`

Scale up or down the display comment size

It is recommended to use [keepCA](#p_keepCA) together

##### showCollision {#p_showCollision}

showCollision:boolean = `false`

This option is effective immediately

Specifies whether or not to draw the hit judgment of the comment.

Defaults (`false`) to no drawing

If `true`, the comment hit detection and the line separator are drawn.

The color of the outer border changes to light blue for HTML5 comments and purple for Flash comments.

##### showCommentCount {#p_showCommentCount}

showCommentCount:boolean = `false`

This option is effective immediately

Specifies whether the number of comments being drawn should be drawn on the screen.

Defaults (`false`) to no drawing

If `true`, the total number of comments drawn on the screen is drawn.、画面内に描画されているコメントの総数を描画します

##### showFPS {#p_showFPS}

showFPS:boolean = `false`

This option is effective immediately

Specifies whether the FPS is drawn on the screen.

Defaults (`false`) to no drawing

If `true`, FPS is displayed.

※This value is calculated based on the time it takes to draw a frame, so it is different from the actual number of frames drawn.

##### useLegacy {#p_useLegacy}

useLegacy:boolean = `false`

::: warning
This option is deprecated. use the [mode](#p_mode) option
:::

Specifies whether official player compatibility mode is enabled

If the default (`false`), the drawing mode is automatically switched for each comment

If `true`, all comments are rendered as HTML5 comments

##### video {#p_video}

video:HTMLVideoElement | null = `null`

This option is effective immediately

If you are using an object or class conforming to IRenderer, set the IRenderer's video property to VideoElement  
If you are using CanvasRenderer, pass VideoElement as the second argument

Specifies the video to be drawn in the background.

If default (`null`), no video is drawn.

If specified, the specified video is drawn in the background and the comment is drawn on top of it.

By applying this function, you can also display comments on Picture in Picture.

### Methods {#Methods}

#### addComments() {#m_addComments}

addComments(...comments:formattedComment):void

This is a feature to dynamically add comments, mainly for live broadcasts.

Comments added by this feature are placed based on a hit decision, but do not affect the position of subsequent comments that have already been placed.

Comments may overlap with each other when placed between already generated comments.

#### addEventListener() {#m_addEventListener}

addEventListener(eventName:CommentEventName, eventHandler:CommentEventHandler):void

Add an event handler

Check the type definition for event details

#### removeEventListener() {#m_removeEventListener}

removeEventListener(eventName:CommentEventName, eventHandler:CommentEventHandler):void

Remove an event handler

Check the type definition for event details

#### drawCanvas() {#m_drawCanvas}

drawCanvas(vpos:number):void

Draws a comment on the canvas based on vpos(currentTime\*100 of the video)

#### clear() {#m_clear}

clear():void

Erase Canvas
