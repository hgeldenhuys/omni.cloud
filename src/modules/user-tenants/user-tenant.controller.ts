import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {UserTenant} from '../../models';
import {UserTenantRepository} from '../../repositories';
import {PermissionKey} from '../auth/permission-key.enum';

export class UserTenantController {
  constructor(
    @repository(UserTenantRepository)
    public userTenantRepository : UserTenantRepository,
  ) {}

  @authenticate(STRATEGY.BEARER)
  @authorize([PermissionKey.CreateTenantUser, PermissionKey.ViewAnyUser, PermissionKey.ViewOwnUser, PermissionKey.ViewTenant, PermissionKey.ViewRole])
  @post('/user-tenants', {
    responses: {
      '200': {
        description: 'UserTenant model instance',
        content: {'application/json': {schema: getModelSchemaRef(UserTenant)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserTenant, {exclude: ['id']}),
        },
      },
    })
    userTenant: Omit<UserTenant, 'id'>,
  ): Promise<UserTenant> {
    return this.userTenantRepository.create(userTenant);
  }

  @get('/user-tenants/count', {
    responses: {
      '200': {
        description: 'UserTenant model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(UserTenant)) where?: Where<UserTenant>,
  ): Promise<Count> {
    return this.userTenantRepository.count(where);
  }

  @get('/user-tenants', {
    responses: {
      '200': {
        description: 'Array of UserTenant model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(UserTenant)},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(UserTenant)) filter?: Filter<UserTenant>,
  ): Promise<UserTenant[]> {
    return this.userTenantRepository.find(filter);
  }

  @patch('/user-tenants', {
    responses: {
      '200': {
        description: 'UserTenant PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserTenant, {partial: true}),
        },
      },
    })
    userTenant: UserTenant,
    @param.query.object('where', getWhereSchemaFor(UserTenant)) where?: Where<UserTenant>,
  ): Promise<Count> {
    return this.userTenantRepository.updateAll(userTenant, where);
  }

  @get('/user-tenants/{id}', {
    responses: {
      '200': {
        description: 'UserTenant model instance',
        content: {'application/json': {schema: getModelSchemaRef(UserTenant)}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<UserTenant> {
    return this.userTenantRepository.findById(id);
  }

  @patch('/user-tenants/{id}', {
    responses: {
      '204': {
        description: 'UserTenant PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserTenant, {partial: true}),
        },
      },
    })
    userTenant: UserTenant,
  ): Promise<void> {
    await this.userTenantRepository.updateById(id, userTenant);
  }

  @put('/user-tenants/{id}', {
    responses: {
      '204': {
        description: 'UserTenant PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() userTenant: UserTenant,
  ): Promise<void> {
    await this.userTenantRepository.replaceById(id, userTenant);
  }

  @del('/user-tenants/{id}', {
    responses: {
      '204': {
        description: 'UserTenant DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userTenantRepository.deleteById(id);
  }
}
