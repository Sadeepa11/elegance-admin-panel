---
description: how to hand over tasks between specialized agents
---

1. **Review Task Status**: Ensure your current subtask is marked `[x]` in `task.md`.
2. **Comment on Progress**: Add a brief comment in `task.md` about what was achieved or any blockers found.
3. **Tag the Successor**: Update the next task name with the role tag for the following agent (e.g., `[ ] [QA] Verify feature`).
4. **Update Documentation**: Ensure `walkthrough.md` is updated if technical details changed.
5. **Ping the Orchestrator**: Call `task_boundary` to let the Orchestrator know the task is ready for the next phase.
