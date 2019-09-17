import {Entity, model, property} from '@loopback/repository';
import {ProviderDatumInterface} from '../interfaces/AuthDataInterface';

@model({settings: {}})
export class ProviderDatum extends Entity implements ProviderDatumInterface {
  @property({
    type: 'string',
    id: true,
  })
  uid: string;

  @property({
    type: 'string',
  })
  displayName: string;

  @property({
    type: 'string',
  })
  photoURL: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: false,
    nullable: true
  })
  phoneNumber?: string | null;

  @property({
    type: 'string',
    required: true,
  })
  providerId: string;


  constructor(data?: Partial<ProviderDatum>) {
    super(data);
  }
}

export interface ProviderDatumRelations {
  // describe navigational properties here
}

export type ProviderDatumWithRelations = ProviderDatum & ProviderDatumRelations;
