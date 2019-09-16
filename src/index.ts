import {OmniCloudApplication} from './application';
import {ApplicationConfig} from '@loopback/core';

export {OmniCloudApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new OmniCloudApplication({
    ...options,
    rest: {
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        maxAge: 86400,
        credentials: true,
      }
    }
  });
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
