/**
 * File: /src/modules/core/exception/index.ts
 * Project: app
 * File Created: 06-11-2022 21:23:28
 * Author: Clay Risser
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

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorInterceptor } from './error.interceptor';

@Module({
  providers: [
    ErrorInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
  exports: [ErrorInterceptor],
})
export class ExceptionModule {}

export * from './error.interceptor';
