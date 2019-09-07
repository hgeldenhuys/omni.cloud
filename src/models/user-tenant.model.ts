import {model, property, belongsTo} from '@loopback/repository';
import {Tenant, TenantWithRelations} from './tenant.model';
import {User, UserWithRelations} from './user.model';
import {Role, RoleWithRelations} from './role.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: 'user_tenants',
})
export class UserTenant extends UserModifiableEntity {
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

  @belongsTo(
    () => Tenant,
    {keyFrom: 'tenantId', name: 'tenantId'},
    {
      name: 'tenantId',
      required: true,
    },
  )
  tenantId: number;

  @belongsTo(
    () => Role,
    {keyFrom: 'roleId', name: 'roleId'},
    {
      name: 'roleId',
      required: true,
    },
  )
  roleId: number;

  @property({
    type: 'string',
    required: true,
    default: 'active',
  })
  status: string;

  constructor(data?: Partial<UserTenant>) {
    super(data);
  }
}

export interface UserTenantRelations {
  user: UserWithRelations;
  tenant: TenantWithRelations;
  role: RoleWithRelations;
}

export type UserTenantWithRelations = UserTenant & UserTenantRelations;
