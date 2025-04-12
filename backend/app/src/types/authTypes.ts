export interface Register {
  name: string;
  email: string;
  password: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface User {
  name: string;
  email: string;
  password: string;
  require2FA: boolean;
  twofa_secret: string;
  is_verified: boolean;
}
