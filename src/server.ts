/* eslint-disable no-console */
import express, {
  Application,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import bodyParser from "body-parser"; // to convert the body of incoming requests into JavaScript objects.
import dotenv from "dotenv"; // to read and load the environment variables from .env file
import envalid from "envalid"; // to validate the environment variables presence
import cors from "cors"; //  to configure Express to add CORS
import helmet from "helmet"; // to secure Express APIs by defining various HTTP headers.
import morgan from "morgan"; // adds some logging capabilities to this Express API.
import { StatusController } from "./api/components/StatusController";
import { StorageController } from "./api/components/StorageController";
import { TokenController } from "./api/components/TokenController";
import { Logger } from "./api/middleware/logger";

/** This is a demo server used to test and validate the actual middleware which is in index.ts */

dotenv.config();
const { str, port, json } = envalid

const env = envalid.cleanEnv(process.env, {
  PORT: port({
    example: "4000",
    default: 4000,
    desc: "The localhost port on which this sample would run",
  }),
  AZURE_TENANT_ID: str({
    default: "microsoft",
    desc: "AD tenant id or name",
  }),
  AZURE_CLIENT_ID: str({
    default: "microsoft",
    desc: "ID of the user/service principal to authenticate as",
  }),
  AZURE_CLIENT_SECRET: str({
    default: "microsoft",
    desc: "client secret used to authenticate to Azure AD",
  }),
});


const loggerMiddleware = (req: Request, resp: Response, next: NextFunction) => {
  Logger.Info(`Request logged:  ${req.method}, ${req.path}`);
  next();
};

class App {
  public app: Application;
  public port: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(appInit: {
    port: number;
    middleWares: RequestHandler[];
    controllers: any;
  }) {
    this.app = express();
    this.port = appInit.port;

    // adding Helmet to enhance API's security
    this.app.use(helmet());

    // enabling CORS for all requests
    this.app.use(cors());

    // adding morgan to log HTTP requests
    this.app.use(morgan('combined'));

    this.middlewares(appInit.middleWares);
    this.routes(appInit.controllers);
    this.assets();
    this.template();

    const consoleLogger: any = {
      log: (severityName: string, message: string, metadata: any) => {
        console.log(message, severityName, metadata);
      }
    };
    Logger.initialize(true, consoleLogger);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares(middleWares: {
    forEach: (arg0: (middleWare: any) => void) => void;
  }) {
    middleWares.forEach((middleWare) => {
      this.app.use(middleWare);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private routes(controllers: {
    forEach: (arg0: (controller: any) => void) => void;
  }) {
    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }

  private assets() {
    // this.app.use(express.static("public"))
    // this.app.use(express.static("views"))
  }

  private template() {
    // this.app.set("view engine", "pug")
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public listen() {
    this.app.listen(this.port, () => {
      Logger.Log(`App listening on the http://localhost:${this.port}`);
    });
  }
}

const appWrapper = new App({
  port: !env.PORT ? 4000 : env.PORT,
  controllers: [
    new StorageController(),
    new StatusController(),
    new TokenController(),
  ],
  middleWares: [
    loggerMiddleware,
    bodyParser.json(),
    // bodyParser.urlencoded({ extended: true })
  ],
});

// test if running in mocha
const isInTest = false; // typeof global.it === "function";
// running as a proper listener process NOT under Mocha
if (!isInTest) {
  appWrapper.listen();
} else {
  // running under mocha, just forward the status code; suppress the stack trace
  appWrapper.app.use(
    (error: Error, req: Request, res: Response, next: NextFunction) => {
      // console.error(error);
      res.sendStatus(res.statusCode);
      next();
    }
  );
}

export default appWrapper.app;
