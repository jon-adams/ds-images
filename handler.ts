import { APIGatewayEvent, ProxyCallback, Context, ProxyHandler, ProxyResult } from "aws-lambda";

export const health: ProxyHandler = (event: APIGatewayEvent, context: Context, cb: ProxyCallback) => {
  // find Accept content-type, defaulting to JSON
  let defaultContentTypeJson: string = "application/json";
  let acceptStr: string = !event.headers || event.headers.Accept == null ? defaultContentTypeJson : event.headers.Accept;
  // if JSON found, use it first, then check for common text/ styles, finally default to JSON if no other type found
  let accept: string = acceptStr === "" ||
    acceptStr.indexOf(defaultContentTypeJson) > -1
    ? defaultContentTypeJson
    : acceptStr.indexOf("text/html") > -1 ? "text/html"
    : acceptStr.indexOf("text/plain") > -1 ? "text/plain"
    : acceptStr.indexOf("*/*") > -1 ? defaultContentTypeJson
    : null;

  let response: ProxyResult = {
      statusCode: 0,
      body: null,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": accept || defaultContentTypeJson
      }
    };

  if (!accept) {
    console.warn(415, new Error("Unsupported Media Type"), acceptStr);
    response.statusCode = 415;
    cb(null, response);
  } else {
    response.statusCode = 200;
    response.body = accept === defaultContentTypeJson ? JSON.stringify({
        message: "Healthy!"
        // debugging://,input: event
        })
        : accept === "text/html" ? "<html><head><title>DS Images</title></head><body><h1>Healthy</h1></body></html>"
        : "Healthy!";
    cb(null, response);
  }
};
