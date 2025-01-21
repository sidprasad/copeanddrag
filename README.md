# Lightweight Visualizations for Lightweight Formal Methods


### How to Run Cope and Drag

#### Prerequisites

- Node.js 
- npm

#### Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Run in `dev` mode: `npm run dev`. This will make the CnD server available on localhost:3000
4. Build/ in production mode.
   1.  `npm run build` This will compile the entire server into the `/dist` folder. This folder is portable and can be copied over to various targets.
   2.  `npm start` (or `node index dist/index.js`). This makes the CnD server available on localhost:3000