import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { AppError, toErrorBody } from '@monaaoua9/app-error';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse();

    if (err instanceof AppError) {
      return reply.status(err.status).send(toErrorBody(err));
    }
    if (err instanceof HttpException) {
      const status = err.getStatus();
      return reply.status(status).send({ error: { code: 'HTTP_' + status, message: err.message } });
    }

    console.error(err);
    reply.status(500).send({ error: { code: 'INTERNAL', message: 'INTERNAL' } });
  }
}
