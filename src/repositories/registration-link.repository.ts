import {DefaultKeyValueRepository, juggler} from '@loopback/repository';
import {RegistrationLink} from '../models';
import {RedisDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RegistrationLinkRepository extends DefaultKeyValueRepository<
  RegistrationLink
> {
  constructor(
    @inject('datasources.redis') dataSource: RedisDataSource,
  ) {
    super(RegistrationLink, dataSource);
  }
}
