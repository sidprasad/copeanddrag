
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
     '@babel/preset-typescript',
      //'@babel/preset-react',      
  ],
}

// module.exports = {
//  // transform: {},
//   presets: [
//     ['@babel/preset-env', {targets: {node: 'current'}}],    
//     '@babel/preset-typescript',
//     // Added for D3-helpers
//     //'@babel/preset-flow'
//   ],
//   plugins: [
//     //"@babel/plugin-proposal-class-properties",
//     //"@babel/plugin-transform-modules-commonjs"
//   ]
// };

