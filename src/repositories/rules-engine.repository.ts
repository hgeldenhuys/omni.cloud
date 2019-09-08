import {DefaultKeyValueRepository} from '@loopback/repository';
import {RulesEngine} from '../models/rules-engine.model';
import {RedisDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RulesEngineRepository extends DefaultKeyValueRepository<
  RulesEngine
> {
  constructor(
    @inject('datasources.redis') dataSource: RedisDataSource,
  ) {
    super(RulesEngine, dataSource);
  }
}
