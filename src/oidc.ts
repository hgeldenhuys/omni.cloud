// import * as express from 'express';
// import {Provider} from 'oidc-provider';
//
// const app = express();
// const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
//
// // eslint-disable-next-line @typescript-eslint/no-floating-promises
// (async () => {
//   let adapter;
//   if (process.env.MONGODB_URI) {
//     adapter = require('./adapters/mongodb'); // eslint-disable-line global-require
//     await adapter.connect();
//   }
//
//   const provider = new Provider(ISSUER, { adapter, ...configuration });
// })();
