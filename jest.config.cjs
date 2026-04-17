const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig')
// ^ From https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping/#jest-config-with-helper

const mapper = pathsToModuleNameMapper(compilerOptions.paths)
mapper['^(\\.{1,2}/.*)\\.js$'] = '$1' 

// Jest doesn't support the "module" field in package.json, which gives webpack
// the hint that @reduxjs/toolkit can also be ESM. So map directly to the ESM version.
//  ... but then we need to include the module in transpilation (below)
// TODO: must be a better way to do this. Or just use Playwright?
mapper['^@reduxjs/toolkit'] = '@reduxjs/toolkit/dist/redux-toolkit.esm.js'
//mapper['jest-websocket-mock'] = 'jest-websocket-mock/lib/jest-websocket-mock.es.js'
//mapper['immer'] = 'immer/dist/immer.esm.js'

// // transform CSS
mapper['\\.(scss|sass|css)$'] = 'identity-obj-proxy'

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {  
  verbose: true,  
  // "TypeScript files (.ts, .tsx) will be transformed by ts-jest to CommonJS syntax, 
  //   leaving JavaScript files (.js, jsx) as-is." "
  //preset: 'ts-jest',  
  //preset: 'ts-jest/presets/default',

  // "TypeScript files (.ts, .tsx) will be transformed by ts-jest to ESM syntax, 
  //   leaving JavaScript files (.js, jsx) as-is."
  // preset: 'ts-jest/presets/default-esm',
  //preset: 'ts-jest/presets/js-with-ts',

  // "TypeScript files (.ts, .tsx) will be transformed by ts-jest to CommonJS syntax, 
  //   and JavaScript files (.js, jsx) will be transformed by babel-jest."
  //preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'node',

  // Manual additions after this point
  
  // added from ts-jest guide 
  // https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
  // added tsx
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.esm.js'], // no need to list .mjs
  //moduleFileExtensions: ['ts', 'tsx', 'mjs', 'js'],
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      //'babel-jest',
      'ts-jest',
      {        
        //babelConfig: true,
        useESM: true
      },
    ],
    // '^.+\\.ts?$': [
    //   'ts-jest',
    //   {
    //     useESM: true,
    //     tsconfig: {
    //         strict: false
    //     },
    //   },
    // ],

    '^.+\\.jsx?$': [
      //'babel-jest',
       'ts-jest',
      {        
        useESM: true
        // https://babeljs.io/docs/en/babel-core/#options        
      },
    ],
  },  
  // From ts-jest guide on supporting paths mapping
  // note we replaced the moduleNameMapper given in the startup guide above
  //modulePaths: ['<rootDir>/packages', '<rootDir>/node_modules'],
  //modulePaths: ['<rootDir>/packages'],
  modulePaths: [compilerOptions.baseUrl],
  // moduleNameMapper: {
  //   '^(\\.{1,2}/.*)\\.js$': '$1',
  // },
  moduleNameMapper: mapper,

  /////////////////////////////////////////////////////////////////
  // Dealing with CJS vs. ESM 
  //    - monaco needs to be transpiled
  //    - @reduxjs needs to be transpiled (and also treated specially, so we can 
  //        use named imports provided by the ESM version, see above.)
  /////////////////////////////////////////////////////////////////
  // Re loading monaco from node_modules:
  // https://github.com/vercel/next.js/issues/36077
  // https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
  // Anything that matches _any_ pattern  will not be transformed. The default includes all of node_modules.
  transformIgnorePatterns: [
             '<rootDir>/node_modules/(?!(monaco-editor|react-monaco-editor|@reduxjs)/)'
  ],

  collectCoverage: false,
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts'],
};
