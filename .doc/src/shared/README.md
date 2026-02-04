# Module: src/shared

## Overview

Shared utilities, types, and configuration management used by the plugin components.

## Public API

**config.ts:**
- `getDelegateDir(workspaceRoot)` - Get .delegate path
- `ensureDelegateDir(workspaceRoot)` - Create directories
- `loadConfig(workspaceRoot)` - Load merged config
- `getDefaultConfig()` - Default configuration object
- `generateLoopFolderName(description)` - Create timestamped folder name
- `createLoopFolder(workspaceRoot, description)` - Initialize new loop
- `createLoopPlanFolder(workspaceRoot, description)` - Initialize loop plan
- `ensureDocsDir(workspaceRoot)` - Create docs directory
- `getTemplatesDir(workspaceRoot)` - Get templates path
- `listTemplates(workspaceRoot)` - List available templates

**state.ts:**
- `loadState(workspaceRoot)` - Load STATE.md as object
- `saveState(workspaceRoot, state)` - Write STATE.md
- `addActivity(workspaceRoot, description, focus?)` - Add activity entry
- `createDefaultState()` - Default ProjectState

**types.ts:**
- All TypeScript interfaces and type definitions

## Architecture

```
+-------------------+
|   commands/dg/    |
|   bin/            |
+--------+----------+
         |
  +------v-------+
  |    shared/    |
  +--------------+
  |  config.ts   | <- directory/file paths, config loading
  |  state.ts    | <- STATE.md read/write
  |  types.ts    | <- all interfaces
  +--------------+
         |
         v
  [.delegate/]
```

## Key Files

| File | Purpose |
|------|---------|
| config.ts | Directory management, config loading, loop folder creation |
| state.ts | PROJECT STATE.md parsing and formatting |
| types.ts | All shared TypeScript interfaces |

## Dependencies

**Inputs:**
- Node.js `fs` module
- Node.js `path` module
- `.delegate/config.json` - User configuration

**Outputs:**
- `.delegate/` directory structure
- `.delegate/STATE.md` - Project state
- `.delegate/loops/*/STATUS.md` - Loop status files
