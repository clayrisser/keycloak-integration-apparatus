/**
 * File: /src/bootstrap/app.ts
 * Project: example-nestjs
 * File Created: 06-12-2021 08:30:36
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 20-11-2022 07:43:29
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

import 'nestjs-axios-logger/axiosInherit';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'app/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { logLevels, registerLogger, registerMiscellaneous, registerSwagger } from './index';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const bootstrappedEvents: BootstrapEventHandler[] = [];
const logger = new Logger('Bootstrap');
const server = express();
let app: NestExpressApplication;

export async function createApp(isServer = false): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register({ registerKeycloak: isServer }),
    new ExpressAdapter(isServer ? server : undefined),
    {
      bodyParser: true,
      bufferLogs: false,
      logger: logLevels,
    },
  );
  const config = app.get(ConfigService);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  if (config.get('CORS') === '1') {
    app.enableCors({ origin: config.get('CORS_ORIGIN') || '*' });
  }
  return app;
}

export async function appListen(app: NestExpressApplication) {
  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') || 5000);
  await app.init();
  await Promise.all([httpListen(server, port, () => logger.log(`listening on port ${port}`))]);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

export async function start() {
  app = await createApp(true);
  await registerLogger(app);
  await registerSwagger(app);
  await registerMiscellaneous(app);
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

export function onBootstrapped(eventHandler: BootstrapEventHandler) {
  bootstrappedEvents.push(eventHandler);
}

async function emitBootstrapped(app: NestExpressApplication) {
  const clonedBootstrappedEvents = [...bootstrappedEvents];
  bootstrappedEvents.splice(0, bootstrappedEvents.length);
  await new Promise((r) => setTimeout(r, 1000, null));
  clonedBootstrappedEvents.forEach((eventHandler: BootstrapEventHandler) => eventHandler(app));
}

declare const module: any;

export type BootstrapEventHandler = (app: NestExpressApplication) => unknown;

export async function httpListen(server: http.RequestListener, port: number, cb: () => void) {
  return new Promise((resolve, reject) => {
    const httpServer = http.createServer(server);
    httpServer.on('error', (err: Error) => reject(err));
    httpServer.on('close', () => resolve(undefined));
    httpServer.listen(port, () => cb());
  });
}
