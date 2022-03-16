/**
 * File: /src/bootstrap/swagger.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 16-03-2022 09:54:12
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

import fs from 'fs-extra';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const rootPath = path.resolve(__dirname, '../..');
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(rootPath, 'package.json')).toString()
);

export function registerSwagger(
  app: NestExpressApplication | NestFastifyApplication
) {
  const configService = app.get(ConfigService);
  const clientSecret = configService.get('KEYCLOAK_CLIENT_SECRET');
  const scopes = [
    ...new Set([
      'openid',
      ...(configService.get('KEYCLOAK_SCOPES') || '')
        .split(' ')
        .filter((scope: string) => scope)
    ])
  ];
  if (
    configService.get('SWAGGER') === '1' ||
    configService.get('DEBUG') === '1'
  ) {
    const options = new DocumentBuilder()
      .setTitle(pkg.name)
      .setDescription(pkg.description)
      .setVersion(pkg.version)
      .addOAuth2({
        name: 'Keycloak',
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: `${configService.get(
              'KEYCLOAK_BASE_URL'
            )}/auth/realms/${configService.get(
              'KEYCLOAK_REALM'
            )}/protocol/openid-connect/auth?nonce=1`,
            scopes: scopes.reduce(
              (scopes: Record<string, boolean>, scope: string) => {
                scopes[scope] = true;
                return scopes;
              },
              {}
            )
          }
        }
      })
      .addBearerAuth()
      .addCookieAuth()
      .build();
    const openApiObject = SwaggerModule.createDocument(app, options);
    const swaggerDocument = {
      ...openApiObject,
      components: {
        ...openApiObject.components,
        schemas: {
          ...(openApiObject.components?.schemas || {})
        }
      },
      paths: {
        ...openApiObject.paths
      },
      security: [
        {
          bearer: []
        }
      ]
    };
    SwaggerModule.setup('api', app, swaggerDocument, {
      customJs: '/swagger.js',
      swaggerOptions: {
        persistAuthorization: true,
        oauth: {
          clientId: configService.get('KEYCLOAK_CLIENT_ID'),
          ...(clientSecret ? { clientSecret } : {}),
          scopes: scopes.join(' ')
        }
      }
    });
  }
}
