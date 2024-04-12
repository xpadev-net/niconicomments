// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import simpleImportSort from "eslint-plugin-simple-import-sort";
import jsdoc from 'eslint-plugin-jsdoc';


export default tseslint.config(
    jsdoc.configs['flat/recommended-typescript-error'],
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "simple-import-sort": simpleImportSort,
            jsdoc,
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.strictTypeCheckedOnly,
        ],
        rules: {
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": "error",
            "no-unused-vars": "off",
            "no-control-regex": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "@typescript-eslint/typedef": "error",
            "jsdoc/require-returns-check": "off"
        },
    },
);