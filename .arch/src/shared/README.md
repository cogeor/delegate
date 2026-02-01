# Module: src/shared

## Overview

Shared utilities, types, and configuration management used by both the daemon and plugin components.

## Public API

**config.ts:**
- `getDreamstateDir(workspaceRoot)` - Get .dreamstate path
- `ensureDreamstateDir(workspaceRoot)` - Create directories
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
+-------------------+     +-------------------+
|      daemon/      |     |      plugin/      |
+--------+----------+     +---------+---------+
         |                          |
         +------------+-------------+
                      |
              +-------v-------+
              |    shared/    |
              +---------------+
              |  config.ts    | <- directory/file paths, config loading
              |  state.ts     | <- STATE.md read/write
              |  types.ts     | <- all interfaces
              +---------------+
                      |
                      v
              [.dreamstate/]
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
- `.dreamstate/config.json` - User configuration

**Outputs:**
- `.dreamstate/` directory structure
- `.dreamstate/STATE.md` - Project state
- `.dreamstate/loops/*/STATUS.md` - Loop status files

## Call Graph

```
config.ts:
  loadConfig()
    +-> getDreamstateDir()
    +-> getDefaultConfig()
    +-> merge user config

  createLoopFolder()
    +-> ensureDreamstateDir()
    +-> generateLoopFolderName()
    +-> mkdirSync()
    +-> writeFileSync(STATUS.md)

  ensureDreamstateDir()
    +-> mkdirSync(.dreamstate)
    +-> mkdirSync(tasks)
    +-> mkdirSync(results)

state.ts:
  addActivity()
    +-> loadState() -> parseStateMd()
    +-> createDefaultState() [if no state]
    +-> saveState() -> formatStateMd() -> writeFileSync()

types.ts: [No runtime - type definitions only]
```
