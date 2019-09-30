import {
  Count,
  CountSchema,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  requestBody, RestBindings,
} from '@loopback/rest';
import {RulesEngine} from '../models/rules-engine.model';
import {engines} from 'omni.engine';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKey} from '../modules/auth/permission-key.enum';
import {RulesEngineRepository} from '../repositories/rules-engine.repository';
import {HttpErrors} from '@loopback/rest/dist';
import {TenantTokenStatus} from '../models';
import {TenantRepository, TenantTokenStatusRepository, UserTenantRepository} from '../repositories';
import {inject} from '@loopback/context';
import {Response} from 'express';
import {stats} from '../stats';

export class RulesEngineController {
  constructor(
    @repository(RulesEngineRepository)
    public rulesEngineRepository: RulesEngineRepository,
    @repository(UserTenantRepository)
    public userTenantRepo: UserTenantRepository,
    @repository(TenantTokenStatusRepository)
    public tenantTokenStatusRepository: TenantTokenStatusRepository,
    @repository(TenantRepository)
    public tenantRepository: TenantRepository,
    @inject(RestBindings.Http.RESPONSE)
    private readonly response: Response,
  ) {}

  @authenticate(STRATEGY.BEARER)
  @authorize([PermissionKey.RunEngine])
  @post('/rules-engines', {
    responses: {
      '200': {
        description: 'RulesEngine model instance',
        content: {'application/json': {schema: getModelSchemaRef(RulesEngine)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RulesEngine, {exclude: ['id']}),
        },
      },
    })
    rulesEngine: Omit<RulesEngine, 'id'>,
  ): Promise<RulesEngine> {
    console.log(`Loading Rules Engine ${rulesEngine.name} - ${rulesEngine.version}`);
    const engine = engines.load(rulesEngine.name, rulesEngine.version, rulesEngine.inputRules, "1.0");
    await this.rulesEngineRepository.set(
      'rules-engine-' + engine.name + '-' + engine.version,
      {
        id: engine.id,
        name: engine.name,
        version: engine.version,
        schemaVersion: engine.schemaVersion,
        inputRules: engine.rules
      }
    );
    const re = this.rulesEngineRepository.get('rules-engine-' + engine.name + '-' + engine.version);
    return re;
  }

  @authenticate(STRATEGY.BEARER)
  @authorize([PermissionKey.RunEngine])
  @get('/rules-engines/count', {
    responses: {
      '200': {
        description: 'RulesEngine model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(RulesEngine)) where?: Where<RulesEngine>,
  ): Promise<Count> {
    return {
      count: Object.keys(engines.registry).length
    };
  }

  @authenticate(STRATEGY.BEARER)
  @authorize([PermissionKey.RunEngine])
  @get('/rules-engines/{name}/{version}', {
    responses: {
      '200': {
        description: 'RulesEngine model instance',
        content: {'application/json': {schema: getModelSchemaRef(RulesEngine)}},
      },
    },
  })
  async findById(
    @param.path.string('name') name: string,
    @param.path.string('version') version: string
  ): Promise<RulesEngine> {
    // const engine = engines.getEngine(name, version);
    const re = this.rulesEngineRepository.get('rules-engine-' + name + '-' + version);
    return re;
  }

  @authenticate(STRATEGY.BEARER)
  @authorize([PermissionKey.RunEngine])
  @post('/run/{name}/{version}', {
    responses: {
      '200': {
        description: 'RulesEngine model instance',
        content: {'application/json': {schema: getModelSchemaRef(RulesEngine)}},
      },
    },
  })
  async run(
    @param.path.string('name') name: string,
    @param.path.string('version') version: string,
    @requestBody() withBom: object
  ): Promise<object> {
    const currentUser = await this.userTenantRepo.getCurrentUser();
    if (currentUser && currentUser.tenant) {
      let tokenStatus = await this.tenantTokenStatusRepository.get(currentUser.tenant.id+"");
      if (!tokenStatus) {
        const tenant = await this.tenantRepository.findOne({
          where: {
            id: currentUser.tenant.id
          }
        });
        if (!tenant) {
          throw new Error("No tenant");
        }
        tokenStatus = new TenantTokenStatus({
          tokenCallsRemaining: tenant.allowedTokenCalls,
          tenantId: tenant.id
        })
      }
      if (tokenStatus.tokenCallsRemaining < 1) {
        const tenant = await this.tenantRepository.findOne({
          where: {
            id: currentUser.tenant.id
          }
        });
        if (!tenant) {
          throw new Error("No tenant");
        }
        if (tenant.allowedTokenCalls < 1) {
          throw new HttpErrors.PreconditionFailed(`No more tokens available for this tenant. Please reload tokens in the dashboard.`);
        } else {
          console.warn("Reloading credits from tenant");
          tokenStatus.tokenCallsRemaining = tenant.allowedTokenCalls;
        }
      }
      tokenStatus.tokenCallsRemaining = tokenStatus.tokenCallsRemaining -1;
      await this.tenantTokenStatusRepository.set(currentUser.tenant.id+"", tokenStatus);
      this.response.setHeader("remaining-calls", tokenStatus.tokenCallsRemaining)
    } else {
      throw new Error("No tenant");
    }

    try {
      if (engines.registry[name] && engines.registry[name][version]) {
        console.log(`Running from local cache: ${name}-${version}`);
        const result = engines.getEngine(name, version).run(withBom);
        return result;
      } else {
        console.log(`No rules engine in local cache: ${name}-${version}`);
        const re = await this.findById(name, version);
        const result = engines.load(re.name, re.version, re.inputRules, re.schemaVersion || "").run(withBom);
        return result;
      }
    } finally {
      stats.rulesCalled += 1;
    }
  }
}
