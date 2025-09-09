---
trigger: always_on
alwaysApply: true
---
"rules": [
    {
      "action": "build",
      "instead_of": "cargo build",
      "use": "stellar contract build"
    },
    {
      "action": "build_wasm",
      "instead_of": "cargo build (for wasm file)",
      "use": "stellar contract build"
    },
    {
      "action": "deploy",
      "instead_of": "cargo deploy",
      "use": "stellar contract deploy"
    },
    {
      "action": "comments",
      "limit": "one-line"
    }
  ]