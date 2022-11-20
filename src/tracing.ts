/**
 * File: /src/tracing.ts
 * Project: app
 * File Created: 22-10-2022 06:38:15
 * Author: Clay Risser
 * -----
 * Last Modified: 20-11-2022 07:25:57
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

import dotenv from 'dotenv';
import path from 'path';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { env } = process;
const logger = console;

const otelSDK = new NodeSDK({
  metricReader: new PrometheusExporter({
    port: Number(env.METRICS_PORT || 3100),
  }),
  spanProcessor: new BatchSpanProcessor(new JaegerExporter()) as any,
  contextManager: new AsyncLocalStorageContextManager(),
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

function shutdown() {
  otelSDK
    .shutdown()
    .catch((err) => logger.error(err))
    .finally(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default otelSDK;
