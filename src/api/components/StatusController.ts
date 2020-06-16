import express from "express";

/** this route is OPEN  */
export class StatusController {
  private status = "all OK";
  public router = express.Router();
  constructor() {
    this.router.get("/status", this.getStatus);
  }
  getStatus = (request: express.Request, response: express.Response) => {
    return response.send(this.status);
  };
}
