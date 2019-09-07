// import {Client, expect} from '@loopback/testlab';
// import {OmniCloudApplication} from '../..';
// import {setupApplication} from './test-helper';
import * as bcrypt from 'bcrypt';

describe('PingController', async () => {
  // let app: OmniCloudApplication;
  // let client: Client;

  const password = await bcrypt.hash(
    "Pass.123!",
    10,
  );
  console.log(password);



  // before('setupApplication', async () => {
  //   ({app, client} = await setupApplication());
  // });
  //
  // after(async () => {
  //   await app.stop();
  // });
  //
  // it('invokes GET /ping', async () => {
  //   const res = await client.get('/ping?msg=world').expect(200);
  //   expect(res.body).to.containEql({greeting: 'Hello from LoopBack'});
  // });
});
