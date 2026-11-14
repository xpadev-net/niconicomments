# Custom Commands

Custom commands specific to niconicomments

Disabled by default. To use them, set [enableCustomCommands](/en/api#p_enableCustomCommands) to `true`

## Flash {#c_flash}

### Format

```
nico:flash
```

Enforces processing as a Flash version comment when in auto mode

※This command is ignored except in auto mode

※If you want to force processing as HTML5 version comments in auto mode, use one of the following commands: defont, mincho, or gothic

## Stroke Color {#c_stroke}

### Format

```
nico:stroke:(color|color code)
```

### Example

```
nico:stroke:red
nico:stroke:#f0f
nico:stroke:#fff5
```

This command allows you to change the color of the comment borders

Colors can be specified with the color command or color code

Color code can also specify transparency

## Waku {#c_waku}

### Format

```
nico:waku:(color|color code)
```

### Example

```
nico:waku:red
nico:waku:#f0f
nico:waku:#fff5
```

You can control the display of frames per comment.

Colors can be specified with the color command or color code

Color code can also specify transparency

## Fill {#c_fill}

### Format

```
nico:fill:(color|color code)
```

### Example

```
nico:fill:red
nico:fill:#f0f
nico:fill:#fff5
```

You can control the background color per comment.

Colors can be specified with the color command or color code

Color code can also specify transparency

## Opacity {#c_opacity}

### Format

```
nico:opacity:(0 <= float <= 1)
```

### Example

```
nico:opacity:0
nico:opacity:0.35
nico:opacity:1
```

Change the opacity of the comment

1 for opaque, 0 for transparent

## Scale {#c_scale}

### Format

```
nico:scale:(0 < float <= 8)
```

### Example

```
nico:scale:0.5
nico:scale:1.5
nico:scale:2
```

You can control the scale per comment.

This is multiplied with options.scale (the global scale).

## Ignore Global Scale {#c_ignore_global_scale}

### Format

```
nico:ignore-global-scale
```

Excludes the target comment from options.scale (the global scale).

When used together with nico:scale, only the nico:scale factor is applied.
