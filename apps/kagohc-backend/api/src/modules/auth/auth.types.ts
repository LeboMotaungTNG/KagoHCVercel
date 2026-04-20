export interface IUser {
  _id?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}
