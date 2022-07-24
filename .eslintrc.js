module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2019,
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.eslint.json']
	},
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	rules: {
		"@typescript-eslint/restrict-template-expressions": "off",
		"@typescript-eslint/unbound-method": "off",
		"no-control-regex": "off",
	},
};