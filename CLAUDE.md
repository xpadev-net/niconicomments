# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Build**: `npm run build` - Full build pipeline (TypeScript + type definitions)
- **Watch**: `npm run watch` - Development build with file watching
- **Type check**: `npm run check-types` - TypeScript type checking without emitting files

### Code Quality
- **Lint**: `npm run lint` - Run Biome linting and formatting checks
- **Lint fix**: `npm run lint:fix` - Auto-fix linting and formatting issues (includes unsafe fixes)
- **Format**: `npm run format:fix` - Auto-format code with Biome

### Testing
- **Run tests**: `npm test` or `docker-compose run --rm pw` - Run Playwright visual regression tests
- **Test server**: `npm run test-server` - Start HTTP server for manual testing

### Documentation
- **Generate docs**: `npm run typedoc` - Generate TypeDoc documentation

## Architecture

This is a high-performance comment rendering library for Niconico-style danmaku comments, compatible with the official Niconico video player.

### Core Components

**Main Entry (`src/main.ts`)**
- `NiconiComments` class: Primary API for rendering comments on canvas
- Handles comment parsing, positioning, collision detection, and rendering
- Supports multiple input formats (legacy, v1, formatted, owner, etc.)

**Input Processing (`src/input/` + `src/inputParser.ts`)**
- Parser system with multiple format support for different comment data structures
- Converts various input formats into a unified `FormattedComment` format
- Each parser in `src/input/` handles specific data formats

**Comment System (`src/comments/`)**
- `BaseComment`: Base class for all comment types
- `HTML5Comment`: Standard HTML5-based comment rendering
- `FlashComment`: Legacy Flash-compatible comment rendering
- Comments are positioned using collision detection algorithms

**Rendering (`src/renderer/`)**
- `CanvasRenderer`: Canvas 2D context abstraction for drawing
- Supports video background rendering and scaling
- Plugin system for extensible rendering capabilities

**Collision Detection & Positioning (`src/utils/comment.ts`)**
- `processMovableComment()`: Handles positioning for moving comments (naka)
- `processFixedComment()`: Handles positioning for fixed comments (ue, shita)
- Timeline-based collision detection system

### Key Architecture Patterns

**Plugin System**: Extensible architecture allowing custom comment processing and rendering through the plugin interface (`IPlugin`)

**Format Abstraction**: Input parsers convert various comment formats into a standardized internal format, enabling support for multiple Niconico comment formats

**Performance Optimization**: Pre-rendering system calculates comment positions during initialization to optimize real-time drawing performance

**Canvas Abstraction**: Renderer interface (`IRenderer`) abstracts canvas operations, making the system testable and potentially extensible to other rendering backends

### Path Aliases
- `@/*` maps to `src/*`

### Testing
- Visual regression testing with Playwright in Docker
- Tests compare rendered comment frames against baseline images
- Test data in `test/sample/commentdata/` with various comment scenarios