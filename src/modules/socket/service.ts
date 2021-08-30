/**
 * File: /src/modules/socket/service.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 18:07:12
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 30-08-2021 18:08:53
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

import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export default class SocketService {
  private readonly logger = new Logger(SocketService.name);

  async createClient(clientId: string, clientSecret: string) {
    this.logger.debug({ clientId, clientSecret });
  }
}
