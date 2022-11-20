/**
 * File: /src/bootstrap/swagger.ts
 * Project: example-nestjs
 * File Created: 06-12-2021 08:30:36
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 20-11-2022 07:01:14
 * Modified By: Clay Risser
 * -----
 * Risser Labs LLC (c) Copyright 2021 - 2022
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

import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import pkg from '../../package.json';

export async function registerSwagger(app: NestExpressApplication) {
  const config = app.get(ConfigService);
  const scopes = [
    ...new Set(['openid', ...(config.get('KEYCLOAK_SCOPES') || '').split(' ').filter((scope: string) => scope)]),
  ];
  if (config.get('SWAGGER') === '1' || config.get('DEBUG') === '1') {
    const options = new DocumentBuilder()
      .setTitle(pkg.name)
      .setDescription(pkg.description)
      .setVersion(pkg.version)
      .addOAuth2({
        name: 'Keycloak',
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: `${config.get('KEYCLOAK_BASE_URL')}/realms/${config.get(
              'KEYCLOAK_REALM',
            )}/protocol/openid-connect/auth?nonce=1`,
            scopes: scopes.reduce((scopes: Record<string, string | boolean>, scope: string) => {
              scopes[scope] = true;
              return scopes;
            }, {}),
          },
        },
      })
      .addBearerAuth()
      .addCookieAuth()
      .build();
    const openApiObject = SwaggerModule.createDocument(app, options);
    const swaggerDocument: OpenAPIObject = {
      ...openApiObject,
      security: [
        {
          bearer: [],
        },
      ],
    };
    const clientSecret = config.get('KEYCLOAK_CLIENT_SECRET');
    SwaggerModule.setup(config.get('SWAGGER_BASE_PATH') || '/swagger', app, swaggerDocument, {
      customJs: '/swagger.js',
      swaggerOptions: {
        persistAuthorization: true,
        initOAuth: {
          ...(clientSecret ? { clientSecret } : {}),
          appName: pkg.name,
          clientId: config.get('KEYCLOAK_CLIENT_ID'),
          scopes,
        },
      },
    });
  }
}
