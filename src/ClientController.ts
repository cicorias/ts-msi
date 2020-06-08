import express from "express";
import httpRequest from "request-promise";

const svcToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1UVTVNVE16TWpZME5BPT0ifQ.eyJ0eXBlIjoic2VydmljZXRva2VuIiwic3ViIjoibXNmdC1henVyZS1zZG1zLXNlcnZpY2UtY2FyYm9uLnNsYnNlcnZpY2UuY29tIiwiaXNzIjoic2F1dGgtcHJldmlldy5zbGIuY29tIiwiYXVkIjoibXNmdC1henVyZS1zZG1zLXNlcnZpY2UtY2FyYm9uLnNsYnNlcnZpY2UuY29tIiwiaWF0IjoxNTkxNDE5Njc5LCJleHAiOjE1OTE1MDYwNzksInByb3ZpZGVyIjoic2xiLmNvbSIsImNsaWVudCI6Im1zZnQtYXp1cmUtc2Rtcy1zZXJ2aWNlLWNhcmJvbi5zbGJzZXJ2aWNlLmNvbSIsImVtYWlsIjoibXNmdC1henVyZS1zZG1zLXNlcnZpY2UtY2FyYm9uLnNsYnNlcnZpY2UuY29tQHNsYi5jb20iLCJ1c2VyaWQiOiJtc2Z0LWF6dXJlLXNkbXMtc2VydmljZS1jYXJib24uc2xic2VydmljZS5jb20iLCJhdXRoeiI6IiIsImRlc2lkIjoibXNmdC1henVyZS1zZG1zLXNlcnZpY2UtY2FyYm9uQHNhdXRoLXNlcnZpY2UtcDRkLmRlc2lkLmRlbGZpLnNsYi5jb20iLCJydF9oYXNoIjoiclZDMzl1RnlYT21WYUhfeWNPVWpxZyJ9.KXRO7mzmWL7FqUuTSVJCBN6I_ufZdKVLMRz4DvxQLKH5VlWBZWzAqubfyNOIcd3E4x4l5ig3-dU7WSMinWUw3n9sIOh1MNck57Rtw-IH8cjv1RBn7k6A9unZtFIPHtONrU-lG0t5fVj22T7OTL-nN2crER5jVqylWjIjX2fXq54vmRGEADxadRHrf6GYQ-zs44Ge3PPYnbq6xW_5caS_t3J4kzTXcgkflEHS0nVWYc4Z0sJAoagpAC8xFyYCwYd_yLlR-i1iDngrfOhatmwwJjAIwMGfBLfFxzEqY_9zZdaNPubJ72rIZghtI0nVX3t0yrXVvZ9spYGcXgecwOCSTQ";

/** this route is to be protected */
export class ClientController {
  private sampleData = JSON.stringify({
    id: 100,
    exp: Math.floor(Date.now() / 1000) + 3600,
    data: "some data",
    blobUrl: "https://dannygsta.blob.core.windows.net/demos",
    blobName: "sampleData",
    jwtoken: svcToken,
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
        Authorization: "Bearer " + svcToken,
        "Content-Type": "application/json",
      },
      json: true,
      url: "http://localhost:4000/sign",
    };
    return await httpRequest.post("http://localhost:4000/sign", options);
  };
}
