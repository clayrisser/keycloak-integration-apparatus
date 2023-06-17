/**
 * File: /src/modules/socket/socket.controller.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 17-06-2023 17:09:09
 * Modified By: Clay Risser
 * -----
 * Risser Labs LLC (c) Copyright 2021
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

import YAML from 'yaml';
import { Body, Logger, Controller, Get, Post } from '@nestjs/common';
import { SocketService } from './socket.service';
import { ConfigBody, CoupledBody, CreatedBody, DecoupledBody, DeletedBody, UpdatedBody } from './socket.dto';

@Controller('socket')
export class SocketController {
  private readonly logger = new Logger(SocketController.name);

  constructor(private readonly socketService: SocketService) {}

  @Get('ping')
  async getHealthz(): Promise<string> {
    return 'pong';
  }

  @Post('config')
  async postConfig(@Body() _body: ConfigBody) {
    this.logger.log('socket config');
    return {};
  }

  @Post('created')
  async postCreated(@Body() _body: CreatedBody): Promise<void> {
    this.logger.log('socket created');
  }

  @Post('coupled')
  async postCoupled(@Body() body: CoupledBody): Promise<void> {
    const replicate = (body.plugConfig.replicate || '').toLowerCase() !== 'false';
    const name = body.plug.metadata?.name ? `keycloak-${body.plug.metadata?.name}` : '';
    const ns = body.plug.metadata?.namespace;
    if (!body.plugConfig.clientId) {
      if (replicate && name && ns) {
        await this.socketService.applySecret(name, ns, {
          ADMIN_PASSWORD: body.socketConfig.keycloakAdminPassword,
          ADMIN_USERNAME: body.socketConfig.keycloakAdminUsername || 'admin',
          BASE_URL: body.socketConfig.keycloakBaseUrl,
          REALM_NAME: body.plugConfig.realm || body.socketConfig.defaultRealm || 'main',
        });
      }
      return;
    }
    const attributes = YAML.parse(body.plugConfig.attributes || '');
    const result = await this.socketService.createOrUpdateClient({
      adminPassword: body.socketConfig.keycloakAdminPassword,
      adminUsername: body.socketConfig.keycloakAdminUsername,
      attributes,
      baseUrl: body.socketConfig.keycloakBaseUrl,
      clientId: body.plugConfig.clientId,
      clientSecret: body.plugConfig.clientSecret,
      description: body.plugConfig.description,
      realmName: body.plugConfig.realm || body.socketConfig.defaultRealm || 'main',
      protocol: body.plugConfig.protocol?.toLowerCase() === 'saml' ? 'saml' : 'openid-connect',
      ...(body.plugConfig.redirectUris
        ? {
            redirectUris: body.plugConfig.redirectUris.split(','),
          }
        : {}),
      ...(body.plugConfig.name
        ? {
            name: body.plugConfig.name,
          }
        : {}),
      ...(body.plugConfig.directAccessGrantsEnabled
        ? {
            directAccessGrantsEnabled: body.plugConfig.directAccessGrantsEnabled?.toLocaleLowerCase() !== 'false',
          }
        : {}),
      ...(body.plugConfig.implicitFlowEnabled
        ? {
            implicitFlowEnabled: body.plugConfig.implicitFlowEnabled?.toLocaleLowerCase() !== 'false',
          }
        : {}),
      ...(body.plugConfig.consentRequired
        ? {
            consentRequired: body.plugConfig.consentRequired?.toLowerCase() !== 'false',
          }
        : {}),
    });
    if (replicate && name && ns) {
      await this.socketService.applySecret(name, ns, {
        ADMIN_PASSWORD: result.adminPassword,
        ADMIN_USERNAME: result.adminUsername || '',
        BASE_URL: result.baseUrl || '',
        CLIENT_ID: result.clientId,
        CLIENT_SECRET: result.clientSecret || '',
        REALM_NAME: result.realmName || '',
        REDIRECT_URIS: (result.redirectUris || []).join(','),
      });
    }
  }

  @Post('updated')
  async postUpdated(@Body() _body: UpdatedBody): Promise<void> {
    this.logger.log('socket updated');
  }

  @Post('decoupled')
  async postDecoupled(@Body() body: DecoupledBody): Promise<void> {
    if (body.plugConfig.cleanup?.toLowerCase() === 'true' || body.plugConfig.cleanup === '1') {
      return this.socketService.removeClient({
        adminPassword: body.socketConfig.keycloakAdminPassword,
        adminUsername: body.socketConfig.keycloakAdminUsername,
        baseUrl: body.socketConfig.keycloakBaseUrl,
        clientId: body.plugConfig.clientId,
        realmName: body.plugConfig.realm || body.socketConfig.defaultRealm || 'main',
      });
    }
  }

  @Post('deleted')
  async postDeleted(@Body() _body: DeletedBody): Promise<void> {
    this.logger.log('socket deleted');
  }
}
