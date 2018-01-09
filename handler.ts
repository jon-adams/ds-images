import { APIGatewayEvent, Context, ProxyCallback, ProxyHandler, ProxyResult } from "aws-lambda";
import { AWSError } from "aws-sdk/global";
import { imageGet, NotFoundError, S3ImageFile } from "./image";

export const image: ProxyHandler = (event: APIGatewayEvent, context: Context, cb: ProxyCallback) => {
    console.log(event, event.path, event.pathParameters, event.queryStringParameters);
    const defaultMimeTypeForErrors = "image/png";
    const dir: string = event.pathParameters.dir;
    const file: string = event.pathParameters.file;
    // category isn't used for the S3 path
    const key = dir + "/" + file;

    if (dir === "" || file === "") {
        console.warn("Missing path parameters", dir, file, event.path);
        cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
        return;
    }

    imageGet(process.env.BUCKET, dir, file, null, null)
        .then((data: S3ImageFile) => {
            const response: ProxyResult = {
                statusCode: 200,
                body: data.base64EncodedData,
                headers: {
                    // "Content-Length": data.length, // automatically sent by API Gateway based on `body` size
                    "Content-Type": data.contentType || defaultMimeTypeForErrors,
                    // TODO: Switch cache settings out of DEBUG mode:
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    // "Cache-Control": "public, max-age=604800, immutable", // one week, hard expiration
                },
                isBase64Encoded: true,
            };
            cb(null, response);
        }).catch((err: NotFoundError) => {
            console.info("Missing S3 target", key, err);
            cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
        }).catch((err: AWSError) => {
            console.error(err.code, err);
            cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
        }).catch((err: Error) => {
            console.error(err);
            cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
        });
};
