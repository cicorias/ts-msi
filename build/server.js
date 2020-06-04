"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
/** This is a demo server used to test and validate the actual middleware which is in index.ts */
dotenv_1.default.config();
// https://dev.to/aligoren/developing-an-express-application-using-typescript-3b1
const loggerMiddleware = (req, resp, next) => {
    console.log('Request logged:', req.method, req.path);
    next();
};
const sharedSecret = "notasecret";
/** this route is to be protected */
class UserController {
    constructor() {
        this.sampleUsers = ['john', 'paul', 'ringo'];
        this.router = express_1.default.Router();
        this.getAllUsers = (request, response) => {
            return response.send(this.sampleUsers);
        };
        this.router.get('/users', this.getAllUsers);
    }
}
/** this route is OPEN  */
class StatusController {
    constructor() {
        this.status = 'all OK';
        this.router = express_1.default.Router();
        this.getStatus = (request, response) => {
            return response.send(this.status);
        };
        this.router.get('/status', this.getStatus);
    }
}
/** this route provides token signing for testing only. */
class SignController {
    constructor() {
        this.status = 'use POST with a json jwt payload';
        this.router = express_1.default.Router();
        this.getSign = (request, response) => {
            return response.send(this.status);
        };
        this.sign = (request, response) => {
            // const options: SignOptions = { algorithm: 'HS256'}
            // const rv = jwt.sign(request.body, sharedSecret, options)
            return response.send('sign NOTR');
        };
        this.router.get('/sign', this.getSign);
        this.router.post('/sign', this.sign);
    }
}
class App {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(appInit) {
        this.app = express_1.default();
        this.port = appInit.port;
        this.middlewares(appInit.middleWares);
        this.routes(appInit.controllers);
        this.assets();
        this.template();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    middlewares(middleWares) {
        middleWares.forEach(middleWare => {
            this.app.use(middleWare);
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    routes(controllers) {
        controllers.forEach(controller => {
            this.app.use('/', controller.router);
        });
    }
    assets() {
        //this.app.use(express.static('public'))
        //this.app.use(express.static('views'))
    }
    template() {
        //this.app.set('view engine', 'pug')
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`);
        });
    }
}
const appWrapper = new App({
    port: (!process.env.PORT) ? 5000 : parseInt(process.env.PORT),
    controllers: [
        new UserController(),
        new StatusController(),
        new SignController()
    ],
    middleWares: [
        loggerMiddleware,
        body_parser_1.default.json(),
    ]
});
//test if running in mocha
const isInTest = false; //typeof global.it === 'function';
//running as a proper listener process NOT under Mocha
if (!isInTest) {
    appWrapper.listen();
}
else {
    //running under mocha, just forward the status code; suppress the stack trace
    appWrapper.app.use((error, req, res, next) => {
        //console.error(error);
        res.sendStatus(res.statusCode);
        next();
    });
}
exports.default = appWrapper.app;
