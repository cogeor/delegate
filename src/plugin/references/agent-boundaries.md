# Agent Boundary Enforcement Policy

This document describes the runtime enforcement of agent isolation via `allowed-tools` restrictions in Claude Code agent definitions.

## Enforcement Mechanism

Claude Code agents are defined with `allowed-tools` in their YAML frontmatter. This is the primary enforcement mechanism - agents cannot use tools not listed.

## Agent Tool Matrix

| Agent | Read | Write | Edit | Glob | Grep | Bash | Task | WebSearch |
|-------|------|-------|------|------|------|------|------|-----------|
| ds-coordinator | ✓ | ✓ | - | ✓ | ✓ | ✓ | ✓ | - |
| ds-planner | ✓ | ✓ | - | ✓ | ✓ | - | - | - |
| ds-executor | ✓ | ✓ | ✓ | - | - | ✓ | - | - |
| ds-tester | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| ds-idle-planner | ✓ | ✓ | - | ✓ | ✓ | - | - | ✓ |
| ds-doc-generator | ✓ | ✓ | - | ✓ | - | - | - | - |

## Rationale

### ds-executor: No Glob/Grep
- **Why**: Executor should trust the task specification
- **Effect**: Prevents "exploring for more context" which dilutes focus
- **Alternative**: If task needs files, Planner includes them in the spec

### ds-idle-planner: No Bash
- **Why**: Read-only planning mode during idle
- **Effect**: Cannot execute code or run tests
- **Alternative**: Focus is on template exploration and plan refinement

### ds-doc-generator: No Grep
- **Why**: Focused on single-file documentation
- **Effect**: Documents one file at a time without searching
- **Alternative**: Receives explicit file path to document

### ds-coordinator: Has Task
- **Why**: Only agent that can spawn other agents
- **Effect**: Orchestrates the loop without doing direct work
- **Alternative**: N/A - this is intentional

### ds-tester: Has Bash
- **Why**: Needs to run tests and verify build
- **Effect**: Can execute `npm test`, `npm run build`, etc.
- **Alternative**: N/A - testing requires execution

## Context Isolation Rules

Beyond tool restrictions, agents follow these context rules:

1. **Coordinator**: Sees loop state, not implementation details
2. **Planner**: Sees draft and project structure, not execution logs
3. **Executor**: Sees task spec, not other tasks or loops
4. **Tester**: Sees implementation to verify, not planning rationale
5. **Idle Planner**: Sees templates and mission, not active loops

## Enforcement Verification

To verify enforcement is working:

```bash
# Check agent tool lists
grep -A 10 "allowed-tools:" src/plugin/agents/*.md

# Verify no unauthorized tool patterns in prompts
grep -r "Use Glob" src/plugin/agents/ds-executor.md  # Should find nothing
```
