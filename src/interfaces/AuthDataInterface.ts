export interface AuthDataInterface {
  uid:             string;
  displayName:     string;
  photoURL:        string;
  email:           string;
  emailVerified:   boolean;
  phoneNumber?:    string | null;
  isAnonymous:     boolean;
  tenantId?:       string;
  providerData:    ProviderDatumInterface[];
  apiKey:          string;
  appName:         string;
  authDomain:      string;
  stsTokenManager: StsTokenManagerInterface;
  redirectEventId?:string;
  lastLoginAt:     string;
  createdAt:       string;
}

export interface ProviderDatumInterface {
  uid:         string;
  displayName: string;
  photoURL:    string;
  email:       string;
  phoneNumber?:string | null;
  providerId:  string;
}

export interface StsTokenManagerInterface {
  apiKey:         string;
  refreshToken?:  string;
  accessToken:    string;
  expirationTime: number;
}
