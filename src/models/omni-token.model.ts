import {Entity, model, property} from '@loopback/repository';

@model({settings: {}})
export class OmniToken extends Entity {
  @property({
    type: 'string',
  })
  accessToken?: string;

  @property({
    type: 'string',
  })
  email?: string;

  @property({
    type: 'string',
  })
  photoUrl?: string;

  @property({
    type: 'string',
  })
  displayName: string;

  @property({
    type: 'string',
  })
  error?: string;

  constructor(data?: Partial<OmniToken>) {
    super(data);
  }
}

export interface OmniTokenRelations {
  // describe navigational properties here
}

export type OmniTokenWithRelations = OmniToken & OmniTokenRelations;
