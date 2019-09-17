import {Entity, model, property} from '@loopback/repository';
import {StsTokenManagerInterface} from '../interfaces/AuthDataInterface';

@model({settings: {}})
export class StsTokenManager extends Entity implements StsTokenManagerInterface {
  @property({
    type: 'string',
    required: true,
  })
  apiKey: string;

  @property({
    type: 'string',
  })
  refreshToken?: string;

  @property({
    type: 'string',
    required: true,
  })
  accessToken: string;

  @property({
    type: 'number',
  })
  expirationTime: number;


  constructor(data?: Partial<StsTokenManager>) {
    super(data);
  }
}

export interface StsTokenManagerRelations {
  // describe navigational properties here
}

export type StsTokenManagerWithRelations = StsTokenManagerInterface & StsTokenManagerRelations;
