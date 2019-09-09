export const enum PermissionKey {
  ViewOwnUser = 'ViewOwnUser',
  ViewAnyUser = 'ViewAnyUser',
  ViewTenantUser = 'ViewTenantUser',
  CreateAnyUser = 'CreateAnyUser',
  CreateTenantUser = 'CreateTenantUser',
  UpdateOwnUser = 'UpdateOwnUser',
  UpdateTenantUser = 'UpdateTenantUser',
  UpdateAnyUser = 'UpdateAnyUser',
  DeleteTenantUser = 'DeleteTenantUser',
  DeleteAnyUser = 'DeleteAnyUser',

  ViewTenant = 'ViewTenant',
  CreateTenant = 'CreateTenant',
  UpdateTenant = 'UpdateTenant',
  DeleteTenant = 'DeleteTenant',

  ViewRole = 'ViewRole',
  CreateRole = 'CreateRole',
  UpdateRole = 'UpdateRole',
  DeleteRole = 'DeleteRole',

  ViewAudit = 'ViewAudit',
  CreateAudit = 'CreateAudit',
  UpdateAudit = 'UpdateAudit',
  DeleteAudit = 'DeleteAudit',

  Ping = 'Ping',
  email = "email",
  profile = "profile",
  openid = "openid",

  // Rules Engine
  RunEngine = "RunEngine"
}
