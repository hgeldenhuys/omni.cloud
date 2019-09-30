import {Model, model, property} from '@loopback/repository';

@model({settings: {}})
export class RegistrationLink extends Model {
  @property({
    type: 'string',
    id: true,
    required: true,
    generated: false,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  linkCode: string;


  constructor(data?: Partial<RegistrationLink>) {
    super(data);
  }
}

export interface RegistrationLinkRelations {
  // describe navigational properties here
}

export type RegistrationLinkWithRelations = RegistrationLink & RegistrationLinkRelations;
