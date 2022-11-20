/**
 * File: /src/app.module.ts
 * Project: app
 * File Created: 22-10-2022 06:38:15
 * Author: Clay Risser
 * -----
 * Last Modified: 20-11-2022 07:01:13
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

import coreModules from 'app/modules/core';
import modules from 'app/modules';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module, Global, DynamicModule } from '@nestjs/common';
import { OpenTelemetryModule } from 'nestjs-otel';
import { TerminusModule } from '@nestjs/terminus';

const { env } = process;

@Global()
@Module({})
export class AppModule {
  public static register(config: RegisterAppModuleConfig): DynamicModule {
    const { registerKeycloak } = {
      registerKeycloak: false,
      ...config,
    };
    return {
      global: true,
      module: AppModule,
      imports: [
        ...coreModules,
        OpenTelemetryModule.forRoot({
          metrics: {
            hostMetrics: true,
            apiMetrics: {
              enable: true,
              ignoreRoutes: ['/favicon.ico'],
              ignoreUndefinedRoutes: false,
            },
          },
        }),
        ConfigModule.forRoot({
          envFilePath: path.resolve(process.cwd(), '.env'),
        }),
        HttpModule.register({
          timeout: 5000,
          maxRedirects: 5,
        }),
        TerminusModule,
        ...modules,
      ],
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}

export interface RegisterAppModuleConfig {
  registerKeycloak?: boolean;
}
