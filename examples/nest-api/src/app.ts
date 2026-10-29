import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ErrorFilter } from './error.filter';
import { OtpController } from './otp.controller';
import { PaymentsController } from './payments.controller';
import { PostsController } from './posts.controller';

@Module({ controllers: [OtpController, PostsController, PaymentsController] })
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
  });
  app.useGlobalFilters(new ErrorFilter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
