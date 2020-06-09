import express from "express";
import httpRequest from "request-promise";

/** this route is to be protected */
export class ClientController {
  private sampleData = JSON.stringify({
    id: 100,
    exp: Math.floor(Date.now() / 1000) + 3600,
    data: "some data",
    blobUrl: "https://dannygsta.blob.core.windows.net/demos",
    blobName: "sampleData",
    jwtoken: "XXX",
  });
  public router = express.Router();
  constructor() {
    this.router.get("/upload", this.uploadData);
  }
  uploadData = async (request: express.Request, response: express.Response) => {
    const options = {
      body: {
        payload: this.sampleData,
      },
      headers: {
        Authorization: "Bearer XXX",
        "Content-Type": "application/json",
      },
      json: true,
      url: "http://localhost:4000/sign",
    };
    return await httpRequest.post("http://localhost:4000/sign", options);
  };
}
