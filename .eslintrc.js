module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		project: 'tsconfig.json',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-tsdoc'],
	extends: [
		'eslint:recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'prettier'
	],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	rules: {
		'@typescript-eslint/prefer-readonly': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		curly: 'error',
		eqeqeq: 'error',
		'guard-for-in': 'error',
		'prefer-const': 'error',
		radix: 'error',
		'no-bitwise': 'off',
                'no-control-regex': 'off',
		'no-caller': 'error',
		'no-underscore-dangle': 'error',
		'no-var': 'error',
		'no-new-wrappers': 'error',
		'no-eval': 'error',
		'no-unused-expressions': 'error',
		'no-await-in-loop': 'error',
		'no-return-await': 'error',
		'no-restricted-imports': [
			'error',
			{
				paths: [''],
				patterns: ['@esgettext/*/src', '**/../dist'],
			},
		],
		'no-console': [
			'error',
			{
				allow: ['debug', 'info', 'time', 'timeEnd', 'trace'],
			},
		],
		'import/order': 'error',
		'import/no-cycle': 'error',
		'import/no-self-import': 'error',
		'import/no-default-export': 'error',
		'tsdoc/syntax': 'warn',
		'import/no-unresolved': [
			'error',
			{
				ignore: [ '^@esgettext/' ],
			},
		],
	},
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'import/named': 'off',
				'no-underscore-dangle': 'off',
			},
		},
		{
			files: ['*.spec.ts', '*.e2e-spec.ts'],
			rules: {
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/unbound-method': 'off',
			},
		},
	],
	ignorePatterns: [
		'/node_modules',
		'webpack.config.mjs',
		'/packages/documentation/_assets/**/*.js'
	],
};
