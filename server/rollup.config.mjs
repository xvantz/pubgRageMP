import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import alias from '@rollup/plugin-alias';
import path from "path";

export default {
    input: 'src/index.ts',
    output: {
        file: '../packages/build/index.mjs',
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        resolve({
            preferBuiltins: true,
            exportConditions: ['node'],
        }),
        alias({
            entries: [
                { find: '@shared', replacement: path.resolve('../shared') },
                { find: '@src', replacement: path.resolve('src')}
            ]
        }),
        commonjs(),
        json(),
        typescript({ tsconfig: './tsconfig.json' })
    ],
};