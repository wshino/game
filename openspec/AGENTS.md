# OpenSpec Agent Instructions

This project uses **OpenSpec** for spec-driven development.

## What is OpenSpec?

OpenSpec is a lightweight framework that ensures humans and AI coding assistants agree on **what to build** before writing code. It provides a structured workflow for proposing, reviewing, and implementing changes.

## Directory Structure

- **`openspec/specs/`** — Current source-of-truth specifications
- **`openspec/changes/`** — Proposed modifications organized by feature
- **`openspec/project.md`** — Project context and conventions
- **`openspec/AGENTS.md`** — This file - instructions for AI assistants

## Workflow for AI Assistants

When implementing changes:

1. **Read** `openspec/project.md` to understand project context
2. **Check** `openspec/specs/` for current specifications
3. **Review** any relevant change proposals in `openspec/changes/`
4. **Follow** the specifications when implementing features
5. **Update** specs when changes are completed

## Key Principles

- **Spec First**: Always check specifications before implementing
- **Documentation**: Keep specs up-to-date with implementation
- **Clarity**: Write clear, actionable specifications
- **Alignment**: Ensure AI and human developers understand requirements the same way

## For Feature Requests

When receiving a new feature request:

1. Create a new change proposal in `openspec/changes/[feature-name]/`
2. Write a `proposal.md` explaining the change
3. Create a `tasks.md` with implementation steps
4. Add spec updates in the `specs/` subdirectory
5. Get approval before implementing

## Resources

- OpenSpec Documentation: https://openspec.dev
- GitHub: https://github.com/Fission-AI/OpenSpec
