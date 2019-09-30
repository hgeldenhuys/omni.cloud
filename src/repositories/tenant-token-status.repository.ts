import {DefaultKeyValueRepository} from '@loopback/repository';
import {TenantTokenStatus} from '../models';
import {RedisDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class TenantTokenStatusRepository extends DefaultKeyValueRepository<
  TenantTokenStatus
> {
  constructor(
    @inject('datasources.redis') dataSource: RedisDataSource,
  ) {
    super(TenantTokenStatus, dataSource);
  }
}
