/**
 * File: /src/modules/core/exception/error.interceptor.ts
 * Project: app
 * File Created: 06-11-2022 21:49:54
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

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import httpStatus from 'http-status';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: Error) => {
        let httpException = err as HttpException;
        if (!(err instanceof HttpException)) {
          let statusCode = Number((err as any).statusCode || (err as any).code || (err as any).status);
          if (statusCode >= 600 || statusCode < 100) statusCode = 500;
          httpException = new HttpException(
            {
              statusCode,
              message: (err as any).messages || err.message || err.toString(),
              error: httpStatus[statusCode] || 'Internal Server Error',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        let statusCode = httpException.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
        if (statusCode >= 600 || statusCode < 100) statusCode = 500;
        const error = httpStatus[statusCode] || 'Internal Server Error';
        const response = httpException.getResponse();
        if (typeof response === 'object') {
          if (Array.isArray(response)) {
            const message = response.map((message) => message.toString());
            (httpException as any).response = {
              statusCode,
              message: message.length === 1 ? message[0] : message,
              error,
            };
          } else {
            let message = (response as any).message;
            if (typeof message === 'undefined' || message === null) {
              message = error;
            } else if (Array.isArray(message)) {
              message = message.map((message) => message.toString());
            } else {
              message = message.toString();
            }
            (httpException as any).response = {
              ...response,
              statusCode,
              message,
              error,
            };
          }
        } else {
          (httpException as any).response = {
            statusCode,
            message: response.toString(),
            error,
          };
        }
        throw httpException;
      }),
    );
  }
}
