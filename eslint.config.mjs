import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import stylistic from "@stylistic/eslint-plugin"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const LINT_DIRECTIVE = /^\s*eslint(-disable|-enable)?\b/

const noComments = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: { forbidden: "Comments are not allowed. Express the intent through names instead." },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (LINT_DIRECTIVE.test(comment.value)) continue
          context.report({ loc: comment.loc, messageId: "forbidden" })
        }
      },
    }
  },
}

const objectWrapping = { multiline: true, minProperties: 4 }

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "@stylistic": stylistic,
      "granny-clone": { rules: { "no-comments": noComments } },
    },
    rules: {
      "granny-clone/no-comments": "error",
      "no-console": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "@stylistic/object-curly-newline": [
        "error",
        {
          ObjectExpression: objectWrapping,
          TSTypeLiteral: objectWrapping,
          TSInterfaceBody: objectWrapping,
        },
      ],
      "@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
    },
  },
]

export default eslintConfig
