/**
 * File: /src/bootstrap/index.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 15:55:45
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 30-08-2021 17:40:49
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

import path from 'path';
import dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Adapter } from '~/types';
import {
  appListen,
  createApp,
  registerEjs,
  registerSwagger
} from '~/bootstrap';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const adapter = Adapter.Express;
let bootstrappedEvents: BootstrapEvent[] = [];
let app: NestExpressApplication | NestFastifyApplication;

export async function start() {
  app = await createApp(adapter);
  await registerEjs(app);
  registerSwagger(app);
  const p = appListen(app);
  await emitBootstrapped(app);
  await p;
}

export async function stop() {
  if (!app) return;
  await app.close();
}

export async function restart() {
  await stop();
  await start();
}

export function onBootstrapped(cb: (...args: any[]) => any) {
  bootstrappedEvents.push(cb);
}

async function emitBootstrapped(
  app: NestExpressApplication | NestFastifyApplication
) {
  const clonedBootstrappedEvents = [...bootstrappedEvents];
  bootstrappedEvents = [];
  await new Promise((r) => setTimeout(r, 1000, null));
  clonedBootstrappedEvents.forEach((event: BootstrapEvent) => event(app));
}

export * from './app';
export * from './ejs';
export * from './swagger';

export type BootstrapEvent = (
  app: NestExpressApplication | NestFastifyApplication
) => any;
