import {inject} from '@loopback/context';
import {post, getModelSchemaRef, requestBody, RestBindings, param} from '@loopback/rest';
import {Request, Response} from 'express';
import {AuthData, OmniToken, User} from '../models';
import {authorize, UserPermissionsFn} from 'loopback4-authorization';
import {
  AuthClientRepository, RefreshTokenRepository,
  TenantRepository,
  UserRepository,
  UserTenantPermissionRepository,
  UserTenantRepository,
} from '../repositories';
import {repository} from '@loopback/repository';
import {LoginController} from '../modules/auth/login.controller';
import {AuthTokenRequest, AuthUser} from '../modules/auth';
import {ClientAuthCode} from 'loopback4-authentication';
import * as jwt from 'jsonwebtoken';
import {PermissionKey} from '../modules/auth/permission-key.enum';
import axios from 'axios';

export class ClientLoginController {
  constructor(
    @inject(RestBindings.Http.REQUEST)  private request: Request,
    @inject(RestBindings.Http.RESPONSE) private readonly response: Response,
    @repository(UserRepository)         public userRepository: UserRepository,
    @repository(AuthClientRepository)   public authClientRepository: AuthClientRepository,
    @repository(TenantRepository)       public tenantRepository: TenantRepository,
    @repository(UserTenantRepository) public userTenantRepository: UserTenantRepository,
    @repository(UserTenantPermissionRepository) public userTenantPermissionRepository: UserTenantPermissionRepository,
    @repository(RefreshTokenRepository) public refreshTokenRepository: RefreshTokenRepository,
  ) {
  }

  @authorize(['*'])
  @post('/client-login', {
    requestBody: {
      content: getModelSchemaRef(AuthData)
    },
    responses: {
      '200': {
        description: 'RulesEngine model count',
        content: {'application/json': {schema: OmniToken}},
      },
    },
  })
  async login(
    @requestBody() authData: AuthData,
    @param.query.string("domain") domain: string,
    @param.query.string("providerId") providerId: string,
  ): Promise<OmniToken> {
    const provider = authData.providerData.find(providerI => providerI.providerId === providerId);

    if (provider && provider.providerId === 'google.com') {
      const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${authData.apiKey}`;
      console.log(`url: ${url}`);
      const data = {idToken: authData.stsTokenManager.accessToken};

      const response = await axios.post(url, data, {headers: {
          'Content-Type': 'application/json'
        },
        data
      })
        .then(function (resp) {
          return resp;
        })
        .catch(function (error) {
          return {
            error
          }
        });
      console.log(`Google response: `, JSON.stringify(response, undefined, 2));
    }

    const user = await this.userRepository.findOne({
      where: {
        email: authData.email
      }
    }) as AuthUser;
    const omniToken: OmniToken = new OmniToken({
      accessToken: "dummy",
      photoUrl: authData.photoURL,
      displayName: authData.displayName
    });
    if (user) {
      omniToken.email = user.email;
      const authClient = await this.authClientRepository.findOne({
        where: {
          domain: domain
        }
      });
      if (authClient) {
        const tenant = await this.tenantRepository.findOne({
          where: {
            id: user.defaultTenant
          }
        });
        if (tenant) {
          const userTenant = await this.userTenantRepository.findOne({
            where: {
              tenantId: tenant.id,
              userId: user.id
            }
          });
          if (userTenant) {
            const userTenantPremission = this.userTenantPermissionRepository.findOne({
              where: {
                userTenantId: userTenant.id
              }
            });
            if (userTenantPremission) {
              const userPermissionsFn: UserPermissionsFn<string> = () => {
                return [
                  PermissionKey.RunEngine
                ]
              };
              const loginController = new LoginController(authClient, user, userPermissionsFn, this.authClientRepository, this.userRepository, this.userTenantRepository, this.userTenantPermissionRepository, this.refreshTokenRepository);
              const codePayload: ClientAuthCode<User> = {
                clientId: authClient.clientId,
                userId: user.id,
              };
              const code = jwt.sign(codePayload, process.env.JWT_SECRET as string, {
                expiresIn: authData.stsTokenManager.expirationTime,
                audience: authClient.clientId,
                subject: user.email,
                issuer: process.env.JWT_ISSUER,
              });
              const authTokenRequest = new AuthTokenRequest({
                clientId: authClient.clientId,
                username: user.username,
                code,
              });
              const token = await loginController.getToken(authTokenRequest);
              omniToken.accessToken = token.accessToken;
            } else {
              omniToken.error = "No User Tenant Permissions found";
            }
          } else {
            omniToken.error = "No user tenant found";
          }
        } else {
          omniToken.error = `No tenant found`;
        }
      } else {
        omniToken.error = `No Client Found ${domain}`;
      }
    } else {
      omniToken.error = "No User Found";
    }
    return omniToken;
  }
}
