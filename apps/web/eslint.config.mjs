import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Phase 2 dependency boundaries: features must not import platform internals.
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/platform/**/internal/**', '**/platform/**/internal/**'],
              message:
                'Import only the public Platform API via @/platform (or app-core). Internal modules are private.',
            },
          ],
        },
      ],
    },
  },
  // Phase 5: prefer Motion Engine tokens over raw duration literals in product UI.
  {
    files: [
      'src/components/dashboard/**/*.{ts,tsx}',
      'src/components/ui/dialog.tsx',
      'src/components/ui/sheet.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/input.tsx',
      'src/components/copy-trading/BrokerConnectModal.tsx',
      'src/components/broker/AccountDetailsModal.tsx',
      'src/components/marketplace/SubscribeModal.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "Property[key.name='duration'][value.type='Literal']",
          message:
            'Use platform.motion() tokens/presets (durationSeconds / motionPresets) instead of hardcoded duration.',
        },
        {
          selector:
            "Property[key.name='ease'][value.type='ArrayExpression']",
          message:
            'Use platform.motion() easing tokens (MOTION_EASING) instead of inline cubic-bezier arrays.',
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
