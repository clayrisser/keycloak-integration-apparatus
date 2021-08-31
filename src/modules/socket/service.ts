/**
 * File: /src/modules/socket/service.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 18:07:12
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 30-08-2021 19:01:31
 * Modified By: Clay Risser <email@clayrisser.com>
 * -----
 * BitSpur Inc. (c) Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import KcAdminClient from 'keycloak-admin';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export default class SocketService {
  private readonly logger = new Logger(SocketService.name);

  async createClient(options: CreateClientOptions) {
    const {
      adminPassword,
      adminUsername,
      authorizationServicesEnabled,
      baseUrl,
      clientId,
      clientSecret,
      directAccessGrantsEnabled,
      implicitFlowEnabled,
      name,
      realmName,
      redirectUris,
      serviceAccountsEnabled
    }: CreateClientOptions = {
      adminUsername: 'admin',
      authorizationServicesEnabled: true,
      baseUrl: 'http://127.0.0.1:8080',
      directAccessGrantsEnabled: true,
      implicitFlowEnabled: true,
      realmName: 'master',
      redirectUris: ['*'],
      serviceAccountsEnabled: true,
      ...options
    };
    const keycloakAdmin = new KcAdminClient({ baseUrl: `${baseUrl}/auth` });
    await keycloakAdmin.auth({
      clientId: 'admin-cli',
      grantType: 'password',
      password: adminPassword,
      username: adminUsername
    });
    keycloakAdmin.setConfig({ realmName });
    const client = (await keycloakAdmin!.clients.find({ clientId }))?.[0];
    if (client) {
      this.logger.log(`client ${clientId} already exists`);
      return;
    }
    await keycloakAdmin!.clients.create({
      clientId,
      directAccessGrantsEnabled,
      implicitFlowEnabled,
      name: name || clientId,
      protocol: 'openid-connect',
      publicClient: !clientSecret?.length,
      redirectUris,
      ...(clientSecret?.length
        ? {
            authorizationServicesEnabled,
            secret: clientSecret,
            serviceAccountsEnabled
          }
        : {})
    });
    this.logger.log(`created client ${clientId}`);
  }
}

export interface CreateClientOptions {
  adminPassword: string;
  adminUsername?: string;
  authorizationServicesEnabled?: boolean;
  baseUrl?: string;
  clientId: string;
  clientSecret?: string;
  directAccessGrantsEnabled?: boolean;
  implicitFlowEnabled?: boolean;
  name?: string;
  realmName?: string;
  redirectUris?: string[];
  serviceAccountsEnabled?: boolean;
}
