import { APIGatewayEvent, Context, ProxyCallback, ProxyHandler, ProxyResult } from "aws-lambda";
import * as _ from "lodash";
import { imageGet, letterGet } from "./src/image";
import { ImageFile } from "./src/ImageFile";
import { NotFoundError } from "./src/NotFoundError";
import { ProviderError } from "./src/ProviderError";

// change this import to use whichever provider you are using
import { getObject } from "./src/aws";

function sanitizeSizeParams(value: string): number {
    return _.clamp(_.toFinite(value), 0, 1000) || 0;
}

function hexColorRegex(val: string): boolean {
    return /^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i
      .test(val);
  }

function sanitizeColorParams(
    value: { [name: string]: string },
    propertyName: string,
    defValue: string): string {
    const color = value ? _.trim(value[propertyName]) : defValue;
    return hexColorRegex(color) ? color : defValue;
}

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

    const width = sanitizeSizeParams(event.queryStringParameters ? event.queryStringParameters.width : "0");
    const height = sanitizeSizeParams(event.queryStringParameters ? event.queryStringParameters.height : "0");

    if (file.length > 1) {
        imageGet(process.env.BUCKET, dir, file, width, height, getObject)
            .then((data: ImageFile) => {
                const response: ProxyResult = {
                    statusCode: 200,
                    body: data.base64Encode(),
                    headers: {
                        // "Content-Length": data.length, // automatically sent by API Gateway based on `body` size
                        "Content-Type": data.contentType || defaultMimeTypeForErrors,
                        // TODO: Switch cache settings out of DEBUG mode:
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        // "Cache-Control": "public, max-age=604800, immutable", // one week, hard expiration
                        "Last-Modified": data.lastModified.toUTCString(),
                    },
                    isBase64Encoded: true,
                };
                cb(null, response);
            }).catch((err: NotFoundError) => {
                console.info("Missing S3 target", key, err);
                cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
            }).catch((err: ProviderError) => {
                console.error(err.code, err);
                cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
            }).catch((err: Error) => {
                console.error(err);
                cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
            });
    } else {
        const primaryColor = sanitizeColorParams(event.queryStringParameters, "primaryColor", "#00255c");
        const secondaryColor = sanitizeColorParams(event.queryStringParameters, "secondaryColor", "#ffffff");
        letterGet(file, width, height, primaryColor, secondaryColor)
            .then((data: ImageFile) => {
                const response: ProxyResult = {
                    statusCode: 200,
                    body: data.base64Encode(),
                    headers: {
                        // "Content-Length": data.length, // automatically sent by API Gateway based on `body` size
                        "Content-Type": defaultMimeTypeForErrors,
                        // TODO: Switch cache settings out of DEBUG mode:
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        // "Cache-Control": "public, max-age=604800, immutable", // one week, hard expiration
                        "Last-Modified": new Date().toUTCString(),
                    },
                    isBase64Encoded: true,
                };
                cb(null, response);
            }).catch((err: Error) => {
                console.error(err);
                cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
            });
    }
};
