import {Account, AccountRelations, User} from '../models';
import {PgdbDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {DefaultUserModifyCrudRepository} from './default-user-modify-crud.repository.base';
import {AuthenticationBindings} from 'loopback4-authentication';
import {AuthUser} from '../modules/auth';
import {DataObject, repository} from '@loopback/repository';
import {UserCredentialsRepository} from './user-credentials.repository';
import {Options} from '@loopback/repository/src/common-types';
import {UserRepository} from './user.repository';

export class AccountRepository extends DefaultUserModifyCrudRepository<
  Account,
  typeof Account.prototype.id,
  AccountRelations
> {
  constructor(
    @inject('datasources.pgdb') dataSource: PgdbDataSource,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    protected readonly getCurrentUser: Getter<AuthUser | undefined>,
    @repository.getter('UserCredentialsRepository')
    public  getUserCredsRepository: Getter<UserCredentialsRepository>,
    @repository('UserRepository')
    public  userRepository: UserRepository,
  ) {
    super(Account, dataSource, getCurrentUser);
  }

  async create(entity: DataObject<Account>, options?: Options): Promise<Account> {
    const lastentity = await this.findOne({order: ["id DESC"]});
    const id = lastentity && lastentity.id ? lastentity.id + 1 : 0;
    entity.id = id;
    const account = await super.create(entity, options);
    return account;
  }
}


export class AccountRepositoryUnsafe extends AccountRepository {
  async getAdmin(): Promise<AuthUser> {
    return (await this.userRepository.findOne({
      where: {
        id: 1
      }
    })) as AuthUser
  }
  async create(entity: DataObject<Account>, options?: Options): Promise<Account> {
    // @ts-ignore
    this.getCurrentUser = this.getAdmin;
    return super.create(entity, options);
  }
}

