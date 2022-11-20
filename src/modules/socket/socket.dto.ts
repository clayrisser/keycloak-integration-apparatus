/**
 * File: /src/modules/socket/socket.dto.ts
 * Project: keycloak-integration-apparatus
 * File Created: 20-11-2022 07:22:58
 * Author: Clay Risser
 * -----
 * Last Modified: 20-11-2022 10:05:58
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

import { Plug, Socket } from 'app/types';

export class CreatedBody {
  socket: Socket;
  version: string;
}

export class CoupledBody {
  plug: Plug;
  plugConfig: Record<string, string>;
  socket: Socket;
  socketConfig: Record<string, string>;
  version: string;
}

export class UpdatedBody {
  plug: Plug;
  plugConfig: Record<string, string>;
  socket: Socket;
  socketConfig: Record<string, string>;
  version: string;
}

export class DecoupledBody {
  plug: Plug;
  plugConfig: Record<string, string>;
  socket: Socket;
  socketConfig: Record<string, string>;
  version: string;
}

export class DeletedBody {
  plug: Plug;
  socket: Socket;
  version: string;
}

export class ConfigBody {
  data: Record<string, string>;
  socket: Socket;
  vars: Record<string, string>;
  version: string;
}
