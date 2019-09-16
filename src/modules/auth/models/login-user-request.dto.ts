import {Model, model, property} from '@loopback/repository';

@model()
export class LoginUserRequest extends Model {

  @property({type: 'string', required: true})
  username: string;

  @property({type: 'string', required: true})
  password: string;

  constructor(data?: Partial<LoginUserRequest>) {
    super(data);
  }
}
