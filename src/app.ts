import { createServer } from "http-proxy";
import configuration from "./../configuration/configuration";
import express, { Request, Response, Application, NextFunction } from "express";
import * as winston from 'winston';
import rateLimit from 'express-rate-limit';

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

  // Setup rate limiter middleware
  private setupRateLimiter(): void {
    this.app.set('trust proxy', 1);
    const limiter = rateLimit({
      windowMs: 2 * 60 * 1000, // 2 minutes
      max: 100,
      message: "Too many requests from this IP, please try again later."
    });

    // Apply rate limiter globally
    this.app.use(limiter);
  }

  public start(): void {
    // Setup rate limiter
    this.setupRateLimiter();

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

    // Enable brands microservice
    this.app.use("/api/v1/brands", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BRANDS_MICROSERVICE")}/brands` });
    });

    // Enable products microservice
    this.app.use("/api/v1/products", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("PRODUCTS_MICROSERVICE")}/products` });
    });

    // Enable blog microservice
    this.app.use("/api/v1/blogs", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("BLOGS_MICROSERVICE")}/blogs` });
    });

    // Enable blog microservice
    this.app.use("/api/v1/instagrams", (req: Request, res: Response) => {
      this.proxy.web(req, res, { target: `${configuration.get("INSTAGRAM_MICROSERVICE")}` });
    });

    // Start the server
    this.app.listen(this.port, () => {
      console.log(`API Gateway listening on port ${this.port}`);
    });
  }
}

try {
  const gateway = new APIGateway();
  gateway.start();
} catch (error) {
  console.error(error);
}
