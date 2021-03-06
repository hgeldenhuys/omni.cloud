import {Getter, inject} from '@loopback/core';
import {
  DataObject, Filter,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import {Options} from '@loopback/repository/src/common-types';
import {HttpErrors} from '@loopback/rest';
import * as bcrypt from 'bcrypt';
import {AuthenticationBindings, AuthErrorKeys} from 'loopback4-authentication';

import {PgdbDataSource} from '../datasources';
import {User, UserRelations, UserCredentials} from '../models';
import {AuthUser} from '../modules/auth';
import {AuthenticateErrorKeys} from '../modules/auth';
import {DefaultUserModifyCrudRepository} from './default-user-modify-crud.repository.base';
import {UserCredentialsRepository} from './user-credentials.repository';

export class UserRepository extends DefaultUserModifyCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly credentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;
  constructor(
    @inject('datasources.pgdb') dataSource: PgdbDataSource,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    protected readonly getCurrentUser: Getter<AuthUser | undefined>,
    @repository.getter('UserCredentialsRepository')
    getUserCredsRepository: Getter<UserCredentialsRepository>,
  ) {
    super(User, dataSource, getCurrentUser);
    this.credentials = this.createHasOneRepositoryFactoryFor(
      'credentials',
      getUserCredsRepository,
    );
  }

  private readonly saltRounds = 10;

  async create(entity: DataObject<User>, options?: Options): Promise<User> {
    try {
      const lastentity = await this.findOne({order: ["id DESC"]});
      const id = lastentity && lastentity.id ? lastentity.id + 1 : 0;
      entity.id = id;
      const user = await super.create(entity, options);
      // Add temporary password for first time
      const password = await bcrypt.hash(
        process.env.USER_TEMP_PASSWORD,
        this.saltRounds,
      );
      const creds = new UserCredentials({
        authProvider: 'internal',
        password: password,
        userId: user.id
      });
      const credentials = this.credentials(user.id);
      await credentials.create(creds);
      return user;
    } catch (err) {
      console.error(err);
      throw new HttpErrors.UnprocessableEntity(`Error while creating user: ${err}`);
    }
  }

  public findOne(filter?: Filter<User>, options?: Options): Promise<User | null> {
    return super.findOne(filter, options);
  }

  async verifyPassword(username: string, password: string): Promise<User> {
    const user = await super.findOne({where: {username}});
    const creds = user && (await this.credentials(user.id).get());
    if (creds && user) console.log(`${username} ${user.username} ${password} ${creds.password}`);
    console.log(bcrypt.hashSync(password, 10));
    if (!user || user.deleted || !creds || !creds.password) {
      throw new HttpErrors.Unauthorized(AuthenticateErrorKeys.UserDoesNotExist);
    } else if (!(await bcrypt.compare(password, creds.password))) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.InvalidCredentials);
    } else if (
      await bcrypt.compare(password, process.env.USER_TEMP_PASSWORD!)
    ) {
      throw new HttpErrors.Forbidden(
        AuthenticateErrorKeys.TempPasswordLoginDisallowed,
      );
    }
    return user;
  }

  async updatePassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<User> {
    const user = await super.findOne({where: {username}});
    const creds = user && (await this.credentials(user.id).get());
    if (!user || user.deleted || !creds || !creds.password) {
      throw new HttpErrors.Unauthorized(AuthenticateErrorKeys.UserDoesNotExist);
    } else if (!(await bcrypt.compare(password, creds.password))) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.WrongPassword);
    } else if (await bcrypt.compare(newPassword, creds.password)) {
      throw new HttpErrors.Unauthorized(
        'Password cannot be same as previous password!',
      );
    }
    await this.credentials(user.id).patch({
      password: await bcrypt.hash(newPassword, this.saltRounds),
    });
    return user;
  }
}

export class UserRepositoryUnsafe extends UserRepository {
  constructor(
    @inject('datasources.pgdb') dataSource: PgdbDataSource,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    protected readonly getCurrentUser: Getter<AuthUser | undefined>,
    @repository.getter('UserCredentialsRepository')
      getUserCredsRepository: Getter<UserCredentialsRepository>,
  ) {
    super(dataSource, () => {return this.getAdmin() || new AuthUser({
      id: 1
    })}, getUserCredsRepository);
  }

  async getAdmin(): Promise<AuthUser> {
    return (await this.findOne({
      where: {
        id: 1
      }
    })) as AuthUser
  }
  async create(entity: DataObject<User>, options?: Options): Promise<User> {
    // @ts-ignore
    this.getCurrentUser = this.getAdmin;
    return super.create(entity, options);
  }
}
