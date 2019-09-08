import {Entity, model, property} from '@loopback/repository';
import {RuleStructureInterface} from 'omni.interfaces';

@model({settings: {}})
export class RulesEngine extends Entity {
  @property({
    type: 'string',
    required: false,
    id: true
  })
  id: string;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  inputRules: RuleStructureInterface[];

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  version: string;

  @property({
    type: 'string',
    default: "1.0",
  })
  schemaVersion?: string;

  constructor(data?: Partial<RulesEngine>) {
    super(data);
  }
}

export interface RulesEngineRelations {
  // describe navigational properties here
}

export type RulesEngineWithRelations = RulesEngine & RulesEngineRelations;
