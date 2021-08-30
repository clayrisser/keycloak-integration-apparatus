/**
 * File: /src/app.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 30-08-2021 18:22:39
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

import KeycloakModule from 'nestjs-keycloak';
import path from 'path';
import { AxiosLoggerModule } from 'nestjs-axios-logger';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module, Global } from '@nestjs/common';
import modules from '~/modules';

const rootPath = path.resolve(__dirname, '..');

@Global()
@Module({
  imports: [
    AxiosLoggerModule.register({
      data: false,
      headers: false,
      requestLogLevel: 'log',
      responseLogLevel: 'log'
    }),
    ConfigModule.forRoot({
      envFilePath: path.resolve(rootPath, '.env')
    }),
    HttpModule.register({}),
    KeycloakModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        let adminPassword = config.get('KEYCLOAK_ADMIN_PASSWORD') || '';
        let adminUsername = config.get('KEYCLOAK_ADMIN_USERNAME') || '';
        const base64AdminPassword = config.get(
          'BASE64_ENCODED_KEYCLOAK_ADMIN_PASSWORD'
        );
        const base64AdminUsername = config.get(
          'BASE64_ENCODED_KEYCLOAK_ADMIN_USERNAME'
        );
        if (base64AdminPassword) {
          adminPassword = Buffer.from(base64AdminPassword, 'base64').toString(
            'utf-8'
          );
        }
        if (base64AdminUsername) {
          adminUsername = Buffer.from(base64AdminPassword, 'base64').toString(
            'utf-8'
          );
        }
        return {
          adminClientId: config.get('KEYCLOAK_ADMIN_CLIENT_ID') || '',
          adminPassword,
          adminUsername,
          baseUrl: config.get('KEYCLOAK_BASE_URL') || '',
          clientId: '',
          clientSecret: '',
          realm: config.get('KEYCLOAK_REALM') || '',
          register: false
        };
      }
    }),
    ...modules
  ],
  providers: [ConfigService],
  exports: [ConfigService]
})
export class AppModule {}
