import {OmniCloudApplication} from './application';
import {ApplicationConfig} from '@loopback/core';

export {OmniCloudApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new OmniCloudApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
