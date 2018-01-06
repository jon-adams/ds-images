import { APIGatewayEvent, Context, ProxyCallback, ProxyHandler, ProxyResult } from "aws-lambda";

export const health: ProxyHandler = (event: APIGatewayEvent, context: Context, cb: ProxyCallback) => {
    // find Accept content-type, defaulting to JSON
    const defaultContentTypeJson: string = "application/json";
    const acceptStr: string = !event.headers || event.headers.Accept == null
        ? defaultContentTypeJson
        : event.headers.Accept;
    // if JSON found, use it first, then check for common text/ styles, finally default to JSON if no other type found
    const accept: string = acceptStr === "" ||
        acceptStr.indexOf(defaultContentTypeJson) > -1
        ? defaultContentTypeJson
        : acceptStr.indexOf("text/html") > -1 ? "text/html"
        : acceptStr.indexOf("text/plain") > -1 ? "text/plain"
        : acceptStr.indexOf("*/*") > -1 ? defaultContentTypeJson
        : null;

    if (!accept) {
        console.warn(415, new Error("Unsupported Media Type"), acceptStr);
        cb(null, { statusCode: 415, body: "Unsupported Media Type", headers: { "Content-Type": "text/plain" } });
    } else {
        const response: ProxyResult = {
            statusCode: 200,
            body: accept === defaultContentTypeJson ? JSON.stringify({
                message: "Healthy!",
                // debugging://,input: event
                })
                : accept === "text/html"
                    ? "<html><head><title>DS Images</title></head><body><h1>Healthy!</h1></body></html>"
                : "Healthy!",
            headers: {
                "Content-Type": accept,
                // "healthy" check should never be cached since it is small and should be always live and non-stale
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        };
        cb(null, response);
    }
};
