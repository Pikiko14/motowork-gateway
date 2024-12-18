import { createServer } from "http-proxy";
import configuration from "./../configuration/configuration";
import express, { Request, Response, Application, NextFunction } from "express";
import * as winston from 'winston';

class APIGateway {
  private proxy: ReturnType<typeof createServer>;
  private app: Application;
  private port: number;

  private logger: winston.Logger;

  constructor() {
    this.app = express();
    this.proxy = createServer();
    this.port = parseInt(configuration.get("PORT")) || 3000;
    this.logger = this.setupLogger();
    this.setupProxyErrorHandler();
  }

  private setupLogger(): winston.Logger {
    const logger = winston.createLogger({
      level: 'error', // Set the log level as needed
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log' }) // Log errors to a file
      ]
    });
    return logger;
  }

  private setupProxyErrorHandler(): void {
    this.proxy.on('error', (err, req, res: any) => {
      this.logger.error(`Proxy Error: ${err.message}`);
      res.status(500).send(`Proxy Error: ${err.message}`);
    });
  }

  public start(): void {
    // Route requests to the auth service
    this.app.use("/api/v1/auth", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BASE_MICROSERVICE")}/auth`});
    });

    this.app.use("/api/v1/banners", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BASE_MICROSERVICE")}/banners` });
    });

    this.app.use("/api/v1/categories", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BASE_MICROSERVICE")}/categories` });
    });

    // enable brands microservice
    this.app.use("/api/v1/brands", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BRANDS_MICROSERVICE")}/brands` });
    });

    // enable products microservice
    this.app.use("/api/v1/products", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("PRODUCTS_MICROSERVICE")}/products` });
    });

    // Start the server
    this.app.listen(this.port, () => {
      console.log(`API Gateway listening on port ${this.port}`);
    });
  }
}

try {
  // Instanciar y empezar el servidor
  const gateway = new APIGateway();
  gateway.start();
} catch (error) {
  console.error(error);
}
