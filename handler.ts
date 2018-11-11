import { APIGatewayEvent, Context, ProxyCallback, ProxyHandler, ProxyResult } from "aws-lambda";
import * as _ from "lodash";
import { imageGet, letterGet } from "./src/image";
import { ImageFile } from "./src/ImageFile";
import { NotFoundError } from "./src/NotFoundError";
import { ProviderError } from "./src/ProviderError";

// change this import to use whichever provider you are using
import { getObject } from "./src/aws";

// defaults
const defaultMimeTypeForErrors = "image/png";
// colors must be in #RGB format, including the starting hash
const defaultPrimaryColor = "#f79622";
const defaultSecondaryColor = "#58585a";
const defaultWidth = 300;
const defaultHeight = 300;

// helper functions
function sanitizeSizeParams(value: string, defaultValue: number): number {
    return _.clamp(_.toFinite(value), 0, 1000) || defaultValue;
}

function hexColorRegex(val: string): boolean {
    return /^#?([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i
      .test(val);
  }

function sanitizeColorParams(
    value: { [name: string]: string },
    propertyName: string,
    defValue: string): string {
    let color = value ? _.trim(value[propertyName]) : defValue;
    if (!_.startsWith(color, "#")) {
        color = "#" + color;
    }

    return hexColorRegex(color) ? color : defValue;
}

function outputImageFile(data: ImageFile, lastModifiedUtc: string, cb: ProxyCallback): void {
    const response: ProxyResult = {
        statusCode: 200,
        body: data.base64Encode(),
        headers: {
            // "Content-Length": data.length, // automatically sent by API Gateway based on `body` size
            "Content-Type": defaultMimeTypeForErrors,
            // "Cache-Control": "no-cache, no-store, must-revalidate",
            "Cache-Control": "public, max-age=604800, immutable", // one week, hard expiration
            "Last-Modified": lastModifiedUtc,
        },
        isBase64Encoded: true,
    };
    cb(null, response);
}

function logAndReturnError(err: Error, statusCode: number, cb: ProxyCallback) {
    console.error(err);
    cb(null, { statusCode, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
}

function logAndReturnNotFound(err: Error, cb: ProxyCallback) {
    console.info(err);
    cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
}

function getLetter(
    letter: string,
    width: number,
    height: number,
    queryString: { [name: string]: string },
    cb: ProxyCallback): void {
    const primaryColor = sanitizeColorParams(queryString, "primaryColor", defaultPrimaryColor);
    const secondaryColor = sanitizeColorParams(queryString, "secondaryColor", defaultSecondaryColor);
    letterGet(letter, width, height, primaryColor, secondaryColor)
        .then((data: ImageFile) => {
            outputImageFile(data, new Date().toUTCString(), cb);
        }).catch((err: Error) => {
            logAndReturnError(err, 500, cb);
        });
}

export const image: ProxyHandler = (event: APIGatewayEvent, context: Context, cb: ProxyCallback) => {
    console.log(event, event.path, event.pathParameters, event.queryStringParameters);
    const dir: string = event.pathParameters.dir;
    const file: string = event.pathParameters.file;

    if (dir === "" || file === "") {
        logAndReturnNotFound(new Error("Missing path parameters"), cb);
        return;
    }

    const canFallBackToLetter = event.queryStringParameters &&
        _.toString(event.queryStringParameters.letter).length > 0 &&
        _.toString(event.queryStringParameters.primaryColor).length > 0 &&
        _.toString(event.queryStringParameters.secondaryColor).length > 0;
    const width = sanitizeSizeParams(event.queryStringParameters
        ? event.queryStringParameters.width
        : defaultWidth.toString(), defaultWidth);
    const height = sanitizeSizeParams(event.queryStringParameters
        ? event.queryStringParameters.height
        : defaultHeight.toString(), defaultHeight);

    if (file.length > 1) {
        imageGet(process.env.BUCKET, dir, file, width, height, getObject)
            .then((data: ImageFile) => {
                outputImageFile(data, data.lastModified.toUTCString(), cb);
            })
            .catch((err: NotFoundError) => {
                if (canFallBackToLetter) {
                    getLetter(event.queryStringParameters.letter, width, height, event.queryStringParameters, cb);
                } else {
                    logAndReturnNotFound(new Error("Missing S3 target"), cb);
                }
            })
            .catch((err: ProviderError) => {
                if (canFallBackToLetter) {
                    getLetter(event.queryStringParameters.letter, width, height, event.queryStringParameters, cb);
                } else {
                    console.error(err.code, err);
                    logAndReturnError(err, 500, cb);
                }
            })
            .catch((err: Error) => {
                logAndReturnError(err, 500, cb);
            });
    } else if (/^[0-9A-Za-z-]$/.test(file)) {
        const primaryColor = sanitizeColorParams(event.queryStringParameters, "primaryColor", defaultPrimaryColor);
        const secondaryColor = sanitizeColorParams(
            event.queryStringParameters,
            "secondaryColor",
            defaultSecondaryColor);
        letterGet(file, width, height, primaryColor, secondaryColor)
            .then((data: ImageFile) => {
                outputImageFile(data, new Date().toUTCString(), cb);
            }).catch((err: Error) => {
                logAndReturnError(err, 500, cb);
            });
    } else {
        cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
    }
};
