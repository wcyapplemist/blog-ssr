import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "custom-rules/no-chinese-chars": "error",
    },
    plugins: {
      "custom-rules": {
        rules: {
          "no-chinese-chars": {
            meta: {
              type: "problem",
              docs: {
                description: "Disallow Chinese characters and punctuation",
                category: "Best Practices",
                recommended: true,
              },
              schema: [],
            },
            create(context) {
              const chineseRegex = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
              
              function checkForChinese(node, value) {
                if (typeof value === "string" && chineseRegex.test(value)) {
                  context.report({
                    node,
                    message: "Chinese characters or punctuation are not allowed in this file.",
                  });
                }
              }
              
              return {
                Literal(node) {
                  checkForChinese(node, node.value);
                },
                TemplateLiteral(node) {
                  node.quasis.forEach((quasi) => {
                    checkForChinese(node, quasi.value.cooked);
                  });
                },
                Program(node) {
                  const sourceCode = context.sourceCode || context.getSourceCode();
                  const text = sourceCode.getText(node);
                  const lines = text.split("\n");
                  
                  lines.forEach((line, index) => {
                    if (chineseRegex.test(line)) {
                      context.report({
                        loc: { line: index + 1, column: 0 },
                        message: "Chinese characters or punctuation are not allowed in this file.",
                      });
                    }
                  });
                },
              };
            },
          },
        },
      },
    },
  },
]);

export default eslintConfig;
