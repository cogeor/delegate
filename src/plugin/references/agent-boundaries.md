# Agent Boundary Enforcement Policy

This document describes the runtime enforcement of agent isolation via `allowed-tools` restrictions in Claude Code agent definitions.

## Enforcement Mechanism

Claude Code agents are defined with `allowed-tools` in their YAML frontmatter. This is the primary enforcement mechanism - agents cannot use tools not listed.

## Agent Tool Matrix

| Agent | Read | Write | Edit | Glob | Grep | Bash | Task | WebSearch |
|-------|------|-------|------|------|------|------|------|-----------|
| ds-planner | ✓ | ✓ | - | ✓ | ✓ | - | - | - |
| ds-executor | ✓ | ✓ | ✓ | - | - | ✓ | - | - |
| ds-tester | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| ds-audit-planner | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | ✓ |
| ds-doc-generator | ✓ | ✓ | - | ✓ | - | - | - | - |

**Note:** Loop coordination (spawning planner/executor/tester) is done by the `/ds:loop` command directly, not by an agent.

## Rationale

### ds-executor: No Glob/Grep
- **Why**: Executor should trust the task specification
- **Effect**: Prevents "exploring for more context" which dilutes focus
- **Alternative**: If task needs files, Planner includes them in the spec

### ds-audit-planner: No Bash
- **Why**: Read-only planning mode during audit
- **Effect**: Cannot execute code or run tests
- **Alternative**: Focus is on template exploration, code introspection, and plan refinement

### ds-doc-generator: No Grep
- **Why**: Focused on single-file documentation
- **Effect**: Documents one file at a time without searching
- **Alternative**: Receives explicit file path to document

### ds-tester: Has Bash
- **Why**: Needs to run tests and verify build
- **Effect**: Can execute `npm test`, `npm run build`, etc.
- **Alternative**: N/A - testing requires execution

## Context Isolation Rules

Beyond tool restrictions, agents follow these context rules:

1. **Planner**: Sees draft and project structure, not execution logs
2. **Executor**: Sees task spec, not other tasks or loops
3. **Tester**: Sees implementation to verify, not planning rationale
4. **Audit Planner**: Sees templates, src/ code, and mission based on audit type

## Enforcement Verification

To verify enforcement is working:

```bash
# Check agent tool lists
grep -A 10 "allowed-tools:" src/plugin/agents/*.md

# Verify no unauthorized tool patterns in prompts
grep -r "Use Glob" src/plugin/agents/ds-executor.md  # Should find nothing
```
