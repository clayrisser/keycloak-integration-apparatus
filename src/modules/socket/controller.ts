/**
 * File: /src/modules/socket/controller.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 18-03-2022 03:25:53
 * Modified By: Clay Risser
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

import { Body, Logger, Controller, Get, Post } from '@nestjs/common';
import { Plug, Socket } from '~/types';
import SocketService from './service';

@Controller('socket')
export default class SocketController {
  constructor(private readonly socketService: SocketService) {}

  private readonly logger = new Logger(SocketController.name);

  @Get('ping')
  async getHealthz(): Promise<string> {
    return 'pong';
  }

  @Post('config')
  async postConfig(@Body() body: ConfigBody) {
    this.logger.log('socket config');
    const config = {
      keycloakAdminPassword: Buffer.from(
        body.vars?.BASE64_ENCODED_KEYCLOAK_ADMIN_PASSWORD || '',
        'base64'
      ).toString('utf-8'),
      keycloakAdminUsername: Buffer.from(
        body.vars?.BASE64_ENCODED_KEYCLOAK_ADMIN_USERNAME || '',
        'base64'
      ).toString('utf-8')
    };
    return config;
  }

  @Post('created')
  async postCreated(@Body() _body: CreatedBody): Promise<void> {
    this.logger.log('socket created');
  }

  @Post('coupled')
  async postCoupled(@Body() body: CoupledBody): Promise<void> {
    const replicate =
      (body.plugConfig.replicate || '').toLowerCase() !== 'false';
    const name = body.plug.metadata?.name
      ? `keycloak-${body.plug.metadata?.name}`
      : '';
    const ns = body.plug.metadata?.namespace;
    if (!body.plugConfig.clientId) {
      if (replicate && name && ns) {
        await this.socketService.applySecret(name, ns, {
          ADMIN_PASSWORD: body.socketConfig.keycloakAdminPassword,
          ADMIN_USERNAME: body.socketConfig.keycloakAdminUsername,
          BASE_URL: body.socketConfig.keycloakBaseUrl,
          REALM_NAME: body.socketConfig.keycloakRealm || 'main'
        });
      }
      return;
    }
    const attributes = (body.plugConfig.attributes || '')
      .split('\n')
      .reduce((attributes: Record<string, string>, attributeStr: string) => {
        const [key, value] = Object.values({
          ...[...new Array(2)],
          ...attributeStr.split(':')
        }) as [string, string | undefined];
        if (typeof key === 'string' && typeof value === 'string') {
          attributes[key] = value.trim();
        }
        return attributes;
      }, {});
    const result = await this.socketService.createClient({
      adminPassword: body.socketConfig.keycloakAdminPassword,
      adminUsername: body.socketConfig.keycloakAdminUsername,
      attributes,
      baseUrl: body.socketConfig.keycloakBaseUrl,
      clientId: body.plugConfig.clientId,
      clientSecret: body.plugConfig.clientSecret,
      description: body.plugConfig.description,
      realmName: body.socketConfig.keycloakRealm,
      protocol:
        body.plugConfig.protocol?.toLowerCase() === 'saml'
          ? 'saml'
          : 'openid-connect',
      ...(body.plugConfig.redirectUris
        ? {
            redirectUris: body.plugConfig.redirectUris.split(',')
          }
        : {}),
      ...(body.plugConfig.name
        ? {
            name: body.plugConfig.name
          }
        : {}),
      ...(body.plugConfig.directAccessGrantsEnabled
        ? {
            directAccessGrantsEnabled:
              body.plugConfig.directAccessGrantsEnabled?.toLocaleLowerCase() !==
              'false'
          }
        : {}),
      ...(body.plugConfig.implicitFlowEnabled
        ? {
            implicitFlowEnabled:
              body.plugConfig.implicitFlowEnabled?.toLocaleLowerCase() !==
              'false'
          }
        : {}),
      ...(body.plugConfig.consentRequired
        ? {
            consentRequired:
              body.plugConfig.consentRequired?.toLowerCase() !== 'false'
          }
        : {})
    });
    if (replicate && name && ns) {
      await this.socketService.applySecret(name, ns, {
        ADMIN_PASSWORD: result.adminPassword,
        ADMIN_USERNAME: result.adminUsername || '',
        BASE_URL: result.baseUrl || '',
        CLIENT_ID: result.clientId,
        CLIENT_SECRET: result.clientSecret || '',
        REALM_NAME: result.realmName || '',
        REDIRECT_URIS: (result.redirectUris || []).join(',')
      });
    }
  }

  @Post('updated')
  async postUpdated(@Body() _body: UpdatedBody): Promise<void> {
    this.logger.log('socket updated');
  }

  @Post('decoupled')
  async postDecoupled(@Body() _body: DecoupledBody): Promise<void> {
    this.logger.log('socket decoupled');
  }

  @Post('deleted')
  async postDeleted(@Body() _body: DeletedBody): Promise<void> {
    this.logger.log('socket deleted');
  }
}

export interface CreatedBody {
  socket: Socket;
  version: string;
}

export interface CoupledBody {
  plug: Plug;
  plugConfig: Record<string, string>;
  socket: Socket;
  socketConfig: Record<string, string>;
  version: string;
}

export interface UpdatedBody {
  version: string;
  plug: Plug;
  socketConfig: Record<string, string>;
  plugConfig: Record<string, string>;
  socket: Socket;
}

export interface DecoupledBody {
  plug: Plug;
  socket: Socket;
  version: string;
}

export interface DeletedBody {
  plug: Plug;
  socket: Socket;
  version: string;
}

export interface ConfigBody {
  data: Record<string, string>;
  socket: Socket;
  vars: Record<string, string>;
  version: string;
}
