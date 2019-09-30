import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {
  get,
  HttpErrors,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings
} from '@loopback/rest';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import {
  authenticate,
  authenticateClient,
  AuthenticationBindings,
  AuthErrorKeys,
  ClientAuthCode,
  STRATEGY,
} from 'loopback4-authentication';
import {
  AuthorizationBindings,
  authorize,
  UserPermissionsFn,
} from 'loopback4-authorization';
import {URLSearchParams} from 'url';

import {CONTENT_TYPE} from '../../controllers/content-type.constant';
import {STATUS_CODE} from '../../controllers/status-codes.enum';
import {AuthClient, RefreshToken, TenantTokenStatus, User} from '../../models';
import {
  AccountRepository,
  AuthClientRepository,
  RefreshTokenRepository, TenantTokenStatusRepository,
  UserRepository,
  UserTenantPermissionRepository,
  UserTenantRepository,
} from '../../repositories';
import {AuthRefreshTokenRequest, AuthTokenRequest, LoginRequest} from './';
import {AuthenticateErrorKeys} from './error-keys';
import {AuthUser} from './models/auth-user.model';
import {TokenResponse} from './models/token-response.dto';
import {LoginUserRequest} from './models/login-user-request.dto';

export class LoginController {
  // sonarignore_start
  constructor(
    @inject(AuthenticationBindings.CURRENT_CLIENT)
    private readonly client: AuthClient | undefined,
    @inject(AuthenticationBindings.CURRENT_USER)
    private readonly user: AuthUser | undefined,
    @inject(AuthorizationBindings.USER_PERMISSIONS)
    private readonly getUserPermissions: UserPermissionsFn<string>,
    @repository(AuthClientRepository)
    public authClientRepository: AuthClientRepository,
    @repository(UserRepository)
    public userRepo: UserRepository,
    @repository(UserTenantRepository)
    public userTenantRepo: UserTenantRepository,
    @repository(UserTenantPermissionRepository)
    public utPermsRepo: UserTenantPermissionRepository,
    @repository(RefreshTokenRepository)
    public refreshTokenRepo: RefreshTokenRepository,
    @repository(TenantTokenStatusRepository)
    public tenantTokenStatusRepository: TenantTokenStatusRepository,
    @repository(AccountRepository)
    public accountRepository: AccountRepository,
  ) {}
  // sonarignore_end

  @authenticateClient(STRATEGY.CLIENT_PASSWORD)
  @authenticate(STRATEGY.LOCAL)
  @authorize(['*'])
  @post('/auth/login', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Auth Code',
        content: {
          [CONTENT_TYPE.JSON]: Object,
        },
      },
    },
  })
  async login(
    @requestBody()
    req: LoginRequest,
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{
    code: string;
  }> {
    console.log(`request.hostname ${request.hostname}`);

    if (!this.client || !this.user) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    } else if (!req.client_secret) {
      throw new HttpErrors.BadRequest(AuthErrorKeys.ClientSecretMissing);
    }
    try {
      const codePayload: ClientAuthCode<User> = {
        clientId: req.client_id,
        userId: this.user.id,
      };
      const token = jwt.sign(codePayload, req.client_secret, {
        expiresIn: this.client.authCodeExpiration,
        audience: req.client_id,
        subject: req.username,
        issuer: process.env.JWT_ISSUER,
      });
      return {
        code: token,
      };
    } catch (error) {
      throw new HttpErrors.InternalServerError(
        AuthErrorKeys.InvalidCredentials,
      );
    }
  }

  @authenticate(STRATEGY.LOCAL)
  @authorize(['*'])
  @post('/auth/login-user', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Login',
        content: {
          [CONTENT_TYPE.JSON]: Object,
        },
      },
    },
  })
  async loginUser(
    @requestBody()
    req: LoginUserRequest,
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{
    code: string;
  }> {
    if (!request.secure) console.warn("Authenticating over non-secure link");
    const validDomains = ["localhost", "cloud.omnirule.io"];
    if (validDomains.indexOf(request.hostname) === -1) {
      console.error(`Invalid domain for request: "${request.hostname}"`);
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    console.log(`request.hostname ${request.hostname}`);
    return {code: "dummy-token"};
    // if (!this.client || !this.user) {
    //   throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    // } else if (!req.client_secret) {
    //   throw new HttpErrors.BadRequest(AuthErrorKeys.ClientSecretMissing);
    // }
    // try {
    //   const codePayload: ClientAuthCode<User> = {
    //     clientId: req.client_id,
    //     userId: this.user.id,
    //   };
    //   const token = jwt.sign(codePayload, this.client.secret, {
    //     expiresIn: this.client.authCodeExpiration,
    //     audience: req.client_id,
    //     subject: req.username,
    //     issuer: process.env.JWT_ISSUER,
    //   });
    //   return {
    //     code: token,
    //   };
    // } catch (error) {
    //   throw new HttpErrors.InternalServerError(
    //     AuthErrorKeys.InvalidCredentials,
    //   );
    // }
  }

  @authenticateClient(STRATEGY.CLIENT_PASSWORD)
  @authenticate(STRATEGY.OAUTH2_RESOURCE_OWNER_GRANT)
  @authorize(['*'])
  @post('/auth/login-token', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Token Response Model',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {'x-ts-type': TokenResponse},
          },
        },
      },
    },
  })
  async loginWithClientUser(
    @requestBody() req: LoginRequest,
  ): Promise<TokenResponse> {
    if (!this.client || !this.user) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    } else if (!this.client.userIds || this.client.userIds.length === 0) {
      throw new HttpErrors.UnprocessableEntity(AuthErrorKeys.ClientUserMissing);
    } else if (!req.client_secret) {
      throw new HttpErrors.BadRequest(AuthErrorKeys.ClientSecretMissing);
    }
    try {
      const payload: ClientAuthCode<User> = {
        clientId: this.client.clientId,
        user: this.user,
      };
      return await this.createJWT(payload, this.client);
    } catch (error) {
      throw new HttpErrors.InternalServerError(
        AuthErrorKeys.InvalidCredentials,
      );
    }
  }

  @authorize(['*'])
  @post('/auth/token', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Token Response',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {'x-ts-type': TokenResponse},
          },
        },
      },
    },
  })
  async getToken(@requestBody() req: AuthTokenRequest): Promise<TokenResponse> {
    const authClient = await this.authClientRepository.findOne({
      where: {
        clientId: req.clientId,
      },
    });
    if (!authClient) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    try {
      console.log(`verify1`);
      const payload: ClientAuthCode<User> = jwt.verify(
        req.code,
        authClient.clientSecret,
        {
          audience: req.clientId,
          subject: req.username,
          issuer: process.env.JWT_ISSUER,
        },
      ) as ClientAuthCode<User>;
      const token = await this.createJWT(payload, authClient);
      const currentUser = await this.userTenantRepo.getCurrentUser();
      if (currentUser && currentUser.tenant) {
        if (currentUser.tenant.allowedTokenCalls < 1) {
          throw new HttpErrors.PreconditionFailed(`No more tokens available for this tenant. [1]`);
        }
        let tokenStatus = await this.tenantTokenStatusRepository.get(currentUser.tenant.id+"");
        if (!tokenStatus) {
          tokenStatus = new TenantTokenStatus({
            tenantId: currentUser.tenant.id,
            tokenCallsRemaining: currentUser.tenant.allowedTokenCalls
          });
          await this.tenantTokenStatusRepository.set(currentUser.tenant.id+"", tokenStatus);
        } else {
          throw new HttpErrors.PreconditionFailed(`No more tokens available for this tenant. [2]`);
        }
      }
      return token;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpErrors.Unauthorized(AuthErrorKeys.CodeExpired);
        // eslint-disable-next-line no-prototype-builtins
      } else if (HttpErrors.HttpError.prototype.isPrototypeOf(error)) {
        throw error;
      } else {
        throw new HttpErrors.Unauthorized(AuthErrorKeys.InvalidCredentials);
      }
    }
  }

  @authorize(['*'])
  @post('/auth/token-refresh', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Token Response',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {'x-ts-type': TokenResponse},
          },
        },
      },
    },
  })
  async exchangeToken(
    @requestBody() req: AuthRefreshTokenRequest,
  ): Promise<TokenResponse> {
    const refreshPayload: RefreshToken = await this.refreshTokenRepo.get(
      req.refreshToken,
    );
    if (!refreshPayload) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.TokenExpired);
    }
    const authClient = await this.authClientRepository.findOne({
      where: {
        clientId: refreshPayload.clientId,
      },
    });
    if (!authClient) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    return this.createJWT(
      {clientId: refreshPayload.clientId, userId: refreshPayload.userId},
      authClient,
    );
  }

  @authenticateClient(STRATEGY.CLIENT_PASSWORD)
  @authenticate(
    STRATEGY.GOOGLE_OAUTH2,
    {
      accessType: 'offline',
      scope: ['profile', 'email'],
      authorizationURL: process.env.GOOGLE_AUTH_URL,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL,
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      tokenURL: process.env.GOOGLE_AUTH_TOKEN_URL,
    },
    (req: Request) => {
      return {
        accessType: 'offline',
        state: Object.keys(req.query)
          .map(key => key + '=' + req.query[key])
          .join('&'),
      };
    },
  )
  @authorize(['*'])
  @get('/auth/google', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Token Response',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {'x-ts-type': TokenResponse},
          },
        },
      },
    },
  })
  async loginViaGoogle(
    @param.query.string('client_id')
    clientId?: string,
    @param.query.string('client_secret')
    clientSecret?: string,
  ): Promise<void> {
    console.log("??");
  }

  @authenticate(
    STRATEGY.GOOGLE_OAUTH2,
    {
      accessType: 'offline',
      scope: ['profile', 'email'],
      authorizationURL: process.env.GOOGLE_AUTH_URL,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL,
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      tokenURL: process.env.GOOGLE_AUTH_TOKEN_URL,
    },
    (req: Request) => {
      const result = {
        accessType: 'offline',
        state: Object.keys(req.query)
          .map(key => `${key}=${req.query[key]}`)
          .join('&'),
      };
      console.log(result);
      return result;
    },
  )
  @authorize(['*'])
  @get('/auth/google-auth-redirect', {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Token Response',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {'x-ts-type': TokenResponse},
          },
        },
      },
    },
  })
  async googleCallback(
    @param.query.string('code') code: string,
    @param.query.string('state') state: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<void> {
    console.log(`called back`, code, state);
    const clientId = new URLSearchParams(state).get('client_id');
    if (!clientId || !this.user) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    const account = await this.accountRepository.findOne( {
      where: {
        userId: this.user.id,
        origin: "google"
      }
    });
    if (!account) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    const client = await this.authClientRepository.findOne({
      where: {
        clientId: clientId,
      },
    });
    if (!client || !client.redirectUrl) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.ClientInvalid);
    }
    try {
      const codePayload: ClientAuthCode<User> = {
        userId: this.user.id,
        clientId,
        user: this.user,
      };
      const token = jwt.sign(codePayload, process.env.GOOGLE_AUTH_CLIENT_SECRET as string, {
        expiresIn: client.authCodeExpiration,
        audience: clientId,
        subject: account.email,
        issuer: process.env.JWT_ISSUER,
      });
      response.redirect(`${client.redirectUrl}?code=${token}`);
    } catch (error) {
      throw new HttpErrors.InternalServerError(AuthErrorKeys.UnknownError);
    }
  }

  private async createJWT(
    payload: ClientAuthCode<User>,
    authClient: AuthClient,
  ): Promise<TokenResponse> {
    try {
      let user: User | undefined;
      if (payload.user) {
        user = payload.user;
      } else if (payload.userId) {
        user = await this.userRepo.findById(payload.userId);
      }
      if (!user) {
        throw new HttpErrors.Unauthorized(
          AuthenticateErrorKeys.UserDoesNotExist,
        );
      }
      const userTenant = await this.userTenantRepo.findOne({
        where: {
          userId: user.getId(),
          tenantId: user.defaultTenant,
        },
      });
      if (!userTenant)  {
        throw new HttpErrors.Unauthorized(
          AuthenticateErrorKeys.UserDoesNotExist,
        );
      } else if (userTenant.status !== 'active') {
        throw new HttpErrors.Unauthorized(AuthenticateErrorKeys.UserInactive);
      }
      // Create user DTO for payload to JWT
      const authUser: AuthUser = new AuthUser(user);
      authUser.tenant = await this.userTenantRepo.tenant(userTenant.id);
      const role = await this.userTenantRepo.role(userTenant.id);
      const utPerms = await this.utPermsRepo.find({
        where: {
          userTenantId: userTenant.id,
        },
        fields: {
          permission: true,
          allowed: true,
        },
      });
      authUser.permissions = this.getUserPermissions(utPerms, role.permissions);
      authUser.role = role.roleKey.toString();
      const accessToken = jwt.sign(
        authUser.toJSON(),
        process.env.JWT_SECRET as string,
        {
          expiresIn: authClient.accessTokenExpiration,
          issuer: process.env.JWT_ISSUER,
        },
      );
      const size = 32,
        ms = 1000;
      const refreshToken: string = crypto.randomBytes(size).toString('hex');
      // Set refresh token into redis for later verification
      await this.refreshTokenRepo.set(
        refreshToken,
        {clientId: authClient.clientId, userId: user.id},
        {ttl: authClient.refreshTokenExpiration * ms},
      );
      return new TokenResponse({accessToken, refreshToken});
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line no-prototype-builtins
      if (HttpErrors.HttpError.prototype.isPrototypeOf(error)) {
        throw error;
      } else {
        throw new HttpErrors.Unauthorized(AuthErrorKeys.InvalidCredentials);
      }
    }
  }
}
