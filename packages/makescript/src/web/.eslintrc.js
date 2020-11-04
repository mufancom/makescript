module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.html'],
      plugins: ['html'],
      extends: ['eslint:recommended'],
    },
    {
      env: {node: false},
      files: ['**/*.{ts,tsx}'],
      extends: ['plugin:@mufan/default'],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      rules: {
        'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
      },
    },
  ],
};
