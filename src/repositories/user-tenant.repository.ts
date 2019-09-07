import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, repository} from '@loopback/repository';

import {PgdbDataSource} from '../datasources';
import {Role, Tenant, User, UserTenant, UserTenantRelations} from '../models';
import {RoleRepository} from './role.repository';
import {TenantRepository} from './tenant.repository';
import {UserRepository} from './user.repository';
import {AuthenticationBindings} from 'loopback4-authentication';
import {AuthUser} from '../modules/auth';
import {DefaultUserModifyCrudRepository} from './default-user-modify-crud.repository.base';

export class UserTenantRepository extends DefaultUserModifyCrudRepository<
  UserTenant,
  typeof UserTenant.prototype.id,
  UserTenantRelations
> {
  public readonly tenant: BelongsToAccessor<
    Tenant,
    typeof UserTenant.prototype.id
  >;

  public readonly user: BelongsToAccessor<User, typeof UserTenant.prototype.id>;
  public readonly role: BelongsToAccessor<Role, typeof UserTenant.prototype.id>;

  constructor(
    @inject('datasources.pgdb') dataSource: PgdbDataSource,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
      protected readonly getCurrentUser: Getter<AuthUser | undefined>,
    @repository.getter(TenantRepository)
      tenantRepositoryGetter: Getter<TenantRepository>,
    @repository.getter(UserRepository)
      userRepositoryGetter: Getter<UserRepository>,
    @repository.getter(RoleRepository)
      roleRepositoryGetter: Getter<RoleRepository>,
  ) {
    super(UserTenant, dataSource, getCurrentUser);

    this.tenant = this.createBelongsToAccessorFor(
      'tenantId',
      tenantRepositoryGetter,
    );

    this.user = this.createBelongsToAccessorFor(
      'userId',
      userRepositoryGetter,
    );

    this.role = this.createBelongsToAccessorFor(
      'roleId',
      roleRepositoryGetter,
    );
  }
}
