import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import turbo from 'eslint-plugin-turbo';
import prettier from 'eslint-config-prettier';

/**
 * Configuracao ESLint partilhada (flat config, ESLint 9).
 * Regras que apoiam a arquitetura da doc: proibir `any` sem justificacao,
 * proibir `@ts-ignore`, e obrigar tratamento de promessas.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    plugins: { turbo },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  prettier,
  {
    ignores: [
      'dist/**',
      '.next/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      'eslint.config.mjs',
    ],
  },
];

export default baseConfig;
