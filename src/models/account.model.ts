import {belongsTo, model, property} from '@loopback/repository';
import {User, UserModifiableEntity} from './index';

@model({settings: {}})
export class Account extends UserModifiableEntity {

  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @belongsTo(
    () => User,
    {keyFrom: 'userId', name: 'userId'},
    {
      name: 'userId',
      required: true,
    },
  )
  userId: number;

  @property({
    type: 'string',
    required: true,
    generated: false,
    key: true
  })
  origin: string;

  @property({
    type: 'string',
    required: true,
    key: true
  })
  email: string;


  constructor(data?: Partial<Account>) {
    super(data);
  }
}

export interface AccountRelations {
  // describe navigational properties here
}

export type AccountWithRelations = Account & AccountRelations;
