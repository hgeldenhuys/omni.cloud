import {Entity, model, property} from '@loopback/repository';
import {AuthDataInterface} from '../interfaces/AuthDataInterface';
import {ProviderDatum} from './provider-datum.model';
import {StsTokenManager} from '../../dist/models';

@model({settings: {}})
export class AuthData extends Entity implements AuthDataInterface {
  @property({
    type: 'string',
    id: true,
    required: true,
    generated: false,
  })
  uid: string;

  @property({
    type: 'string',
  })
  displayName: string;

  @property({
    type: 'string'
  })
  photoURL: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'boolean',
  })
  emailVerified: boolean;

  @property({
    type: 'string',
    required: false,
    nullable: true
  })
  phoneNumber?: string | null;

  @property({
    type: 'boolean',
  })
  isAnonymous: boolean;

  @property({
    type: 'string',
  })
  tenantId?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  providerData: ProviderDatum[];

  @property({
    type: 'string',
  })
  apiKey: string;

  @property({
    type: 'string',
  })
  appName: string;

  @property({
    type: 'string',
  })
  authDomain: string;

  @property({
    type: 'object',
  })
  stsTokenManager: StsTokenManager;

  @property({
    type: 'string',
  })
  redirectEventId?: string;

  @property({
    type: 'string',
  })
  lastLoginAt: string;

  @property({
    type: 'string',
  })
  createdAt: string;


  constructor(data?: Partial<AuthData>) {
    super(data);
  }
}

export interface AuthDataRelations {
  // describe navigational properties here
}

export type AuthDataWithRelations = AuthData & AuthDataRelations;
