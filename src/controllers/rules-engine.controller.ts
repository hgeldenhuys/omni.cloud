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
  requestBody,
} from '@loopback/rest';
import {RulesEngine} from '../models/rules-engine.model';
import {engines} from 'omni.engine';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKey} from '../modules/auth/permission-key.enum';
import {RulesEngineRepository} from '../repositories/rules-engine.repository';

export class RulesEngineController {
  constructor(
    @repository(RulesEngineRepository)
    public rulesEngineRepository: RulesEngineRepository,
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
  }
}
