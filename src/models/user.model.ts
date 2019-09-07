import {hasOne, model, property} from '@loopback/repository';
import {IAuthUser} from 'loopback4-authentication';

import {
  UserCredentials,
  UserCredentialsWithRelations,
} from './user-credentials.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: 'users',
})
export class User extends UserModifiableEntity implements IAuthUser {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    name: 'firstName',
  })
  firstName: string;

  @property({
    type: 'string',
    name: 'lastName',
  })
  lastName: string;

  @property({
    type: 'string',
    name: 'middleName',
  })
  middleName?: string;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
  })
  email?: string;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'number',
    name: 'defaultTenant',
  })
  defaultTenant: number;

  @property({
    type: 'date',
    name: 'lastLogin',
    postgresql: {
      column: 'lastLogin',
    },
  })
  lastLogin?: string;

  @hasOne(() => UserCredentials, {keyTo: 'userId'})
  credentials: UserCredentials;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  credentials: UserCredentialsWithRelations;
}

export type UserWithRelations = User & UserRelations;
