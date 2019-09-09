import {inject} from '@loopback/core';

import {PgdbDataSource} from '../datasources';
import {AuthClient} from '../models';
import {DefaultSoftCrudRepository} from './default-soft-crud.repository.base';
import {Filter, Options} from '@loopback/repository';

export class AuthClientRepository extends DefaultSoftCrudRepository<
  AuthClient,
  typeof AuthClient.prototype.id
> {
  constructor(@inject('datasources.pgdb') dataSource: PgdbDataSource) {
    super(AuthClient, dataSource);
  }
  public findOne(filter?: Filter<AuthClient>, options?: Options): Promise<AuthClient | null> {
    return super.findOne(filter, options);
  }
}
