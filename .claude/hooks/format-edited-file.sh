#!/usr/bin/env bash
set -uo pipefail

file_path=$(jq -r '.tool_input.file_path // empty')
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[[ -z "$file_path" || ! -f "$file_path" ]] && exit 0

case "$file_path" in
  "$project_dir"/node_modules/* | "$project_dir"/.next/* | "$project_dir"/public/*) exit 0 ;;
  "$project_dir"/*) ;;
  *) exit 0 ;;
esac

cd "$project_dir" || exit 0

case "$file_path" in
  *.ts | *.tsx | *.js | *.mjs)
    npx --no-install eslint --fix "$file_path" > /dev/null 2>&1
    npx --no-install prettier --write "$file_path" > /dev/null 2>&1
    if ! lint_output=$(npx --no-install eslint "$file_path" 2>&1); then
      echo "$lint_output" >&2
      exit 2
    fi
    ;;
  *.json | *.css | *.md)
    npx --no-install prettier --write --ignore-unknown "$file_path" > /dev/null 2>&1
    ;;
esac

exit 0
