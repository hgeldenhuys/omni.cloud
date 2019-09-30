import {Entity, model, property} from '@loopback/repository';

@model({settings: {}})
export class TenantTokenStatus extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
    generated: false,
  })
  tenantId: number;

  @property({
    type: 'number',
    required: true,
  })
  tokenCallsRemaining: number;


  constructor(data?: Partial<TenantTokenStatus>) {
    super(data);
  }
}

export interface TenantTokenStatusRelations {
  // describe navigational properties here
}

export type TenantTokenStatusWithRelations = TenantTokenStatus & TenantTokenStatusRelations;
