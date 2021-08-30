/**
 * File: /src/modules/socket/controller.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 30-08-2021 18:08:13
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

import { Body, Logger, Controller, Get, Post } from '@nestjs/common';
import { HashMap, Plug, Socket } from '~/types';

@Controller('socket')
export default class SocketController {
  private readonly logger = new Logger(SocketController.name);

  @Get('ping')
  async getHealthz(): Promise<string> {
    return 'pong';
  }

  @Post('config')
  async postConfig(@Body() body: ConfigBody) {
    this.logger.log('socket config');
    return body?.data || {};
  }

  @Post('created')
  async postCreated(@Body() _body: CreatedBody): Promise<void> {
    this.logger.log('socket created');
  }

  @Post('coupled')
  async postCoupled(@Body() body: CoupledBody): Promise<void> {
    this.logger.log('socket coupled', body?.plugConfig);
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
  plugConfig: HashMap<string>;
  socket: Socket;
  socketConfig: HashMap<string>;
  version: string;
}

export interface UpdatedBody {
  version: string;
  plug: Plug;
  socketConfig: HashMap<string>;
  plugConfig: HashMap<string>;
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
  data: HashMap<string>;
  socket: Socket;
  vars: HashMap<string>;
  version: string;
}
