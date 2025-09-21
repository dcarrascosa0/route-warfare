/**
 * Authentication API client.
 */

import { BaseApiClient } from './base-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
  EmailVerificationRequest,
  User,
} from '../types';

export class AuthApiClient extends BaseApiClient {
  async login(request: LoginRequest) {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: request,
      skipAuth: true,
    });
  }

  async register(request: RegisterRequest) {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: request,
      skipAuth: true,
    });
  }

  async logout() {
    return this.request<unknown>('/auth/logout', {
      method: 'POST',
    });
  }

  async logoutAll() {
    return this.request<unknown>('/auth/logout-all', {
      method: 'POST',
    });
  }

  async verifyToken() {
    return this.request<unknown>('/auth/verify-token');
  }

  async me() {
    return this.request<User>('/auth/me');
  }

  async forgotPassword(request: PasswordResetRequest) {
    return this.request<unknown>('/auth/forgot-password', {
      method: 'POST',
      body: request,
      skipAuth: true,
    });
  }

  async resetPassword(request: PasswordResetConfirmRequest) {
    return this.request<unknown>('/auth/reset-password', {
      method: 'POST',
      body: request,
      skipAuth: true,
    });
  }

  async verifyEmail(request: EmailVerificationRequest) {
    return this.request<unknown>('/auth/verify-email', {
      method: 'POST',
      body: request,
      skipAuth: true,
    });
  }

  async changePassword(request: ChangePasswordRequest) {
    return this.request<unknown>('/auth/change-password', {
      method: 'POST',
      body: request,
    });
  }
}

export const authClient = new AuthApiClient();