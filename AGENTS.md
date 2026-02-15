# AGENTS.md - Development Guidelines

This repository contains two main projects:

- **Quartz** (root): TypeScript static site generator
- **Nanobot** (`nanobot/`): Python AI assistant framework

---

## Build / Test / Lint Commands

### Quartz (Root Directory)

```bash
# Install dependencies
npm ci

# Run all tests
npm test

# Run single test file
npx tsx --test quartz/util/path.test.ts

# Type check and lint (Prettier)
npm run check

# Format code
npm run format

# Build docs site
npx quartz build --serve -d docs
```

### Nanobot (nanobot/ directory)

```bash
cd nanobot

# Install dependencies
pip install -e ".[dev]"

# Run all tests
pytest

# Run single test file
pytest tests/test_commands.py

# Run single test
pytest tests/test_commands.py::test_onboard_fresh_install

# Lint and format (Ruff)
ruff check .
ruff format .
```

---

## Code Style Guidelines

### TypeScript (Quartz)

**Imports**

- Use ES modules (`"type": "module"` in package.json)
- Group imports: external libs first, then internal modules
- Use `import type` for type-only imports

**Formatting** (Prettier)

- Print width: 100
- No semicolons (`semi: false`)
- Trailing commas: all
- Tab width: 2 spaces
- Quote props: as-needed

**Types**

- Enable strict mode in tsconfig
- Use branded types for nominal typing (e.g., `SlugLike<T>`)
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions

**Naming**

- Components: PascalCase (e.g., `Head.tsx`)
- Utilities: camelCase (e.g., `path.ts`)
- Types/Interfaces: PascalCase with descriptive names
- Type guards: prefix with `is` (e.g., `isFullSlug()`)

**Error Handling**

- Use early returns for validation
- Prefer `try/catch` over throwing strings
- Return `null` or `undefined` for missing data, throw for errors

**React/Preact**

- Use functional components with arrow functions
- Use `satisfies` for component constructors
- Props interface: `QuartzComponentProps`

### Python (Nanobot)

**Imports**

- Group: stdlib, third-party, local (each group separated by blank line)
- Use absolute imports within package

**Formatting** (Ruff)

- Line length: 100
- Target Python: 3.11+
- Use `ruff format` before committing

**Types**

- Use type hints on all function signatures
- Use `|` for union types (e.g., `str | None`)
- Pydantic models for configuration schemas

**Naming**

- Functions/variables: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Private: prefix with `_`

**Error Handling**

- Use `loguru` for logging
- Prefer explicit error types over bare `Exception`
- Use `typer` for CLI error presentation

---

## Testing Conventions

**TypeScript**

- Use Node.js built-in test runner (`node:test`)
- Import: `import test, { describe } from "node:test"`
- Assertions: `import assert from "node:assert"`
- Group tests with `describe()`, individual cases with `test()`

**Python**

- Use pytest with async support
- Fixtures in `conftest.py` or test files
- Mock external dependencies (filesystem, APIs)
- Use `CliRunner` from typer for CLI tests

---

## Project Structure

```
quartz/           # TypeScript SSG components
├── components/   # React/Preact components
├── util/         # Utility functions
└── plugins/      # Transform and emitter plugins

nanobot/          # Python AI assistant
├── nanobot/      # Main package
│   ├── cli/      # Command-line interface
│   ├── config/   # Configuration schemas
│   └── agent/    # AI agent tools
└── tests/        # Test suite
```

---

## Commit Guidelines

- Run `npm run check` and `npm test` before committing Quartz changes
- Run `ruff check .` and `pytest` before committing Nanobot changes
- Never commit secrets or API keys
