import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import { colorizedMorganMiddleware } from '@project-lc/nest-modules';

export class AppSetting {
  private corsOptions = {
    origin: [
      'http://localhost:4200',
      'http://localhost:3011',
      'https://project-lc.vercel.app',
    ],
    credentials: true,
  };

  constructor(private readonly app: NestExpressApplication) {}

  public initialize(): void {
    this.app.use(helmet());
    this.app.use(cors(this.corsOptions));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(cookieParser('@#@$MYSIGN#@$#$'));
    this.app.use(colorizedMorganMiddleware);
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }
}
