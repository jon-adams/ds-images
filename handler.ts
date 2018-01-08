import { APIGatewayEvent, Context, ProxyCallback, ProxyHandler, ProxyResult } from "aws-lambda";
import S3 = require("aws-sdk/clients/s3");
import { GetObjectOutput } from "aws-sdk/clients/s3";
import { AWSError } from "aws-sdk/global";

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

    new S3().getObject({
        Bucket: process.env.BUCKET,
        Key: key,
        }).promise()
            .then((result: S3.GetObjectOutput) => {
                const body = Buffer.isBuffer(result.Body)
                    ? result.Body
                    : new Buffer(result.Body.toString(), "binary");
                const data = body.toString("base64");
                const response: ProxyResult = {
                    statusCode: 200,
                    body: data,
                    headers: {
                        // "Content-Length": data.length, // already sent by AWS automatically
                        // TODO: ContentType needs loaded from MIME and/or file extension
                        "Content-Type": "image/png",
                        // TODO: Switch cache settings out of DEBUG mode:
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        // "Cache-Control": "public, max-age=604800, immutable", // one week, hard expiration
                    },
                    isBase64Encoded: true,
                };
                cb(null, response);
            }).catch((err: AWSError) => {
                if (err.code === "NoSuchKey") {
                    console.info("Missing file", key);
                    cb(null, { statusCode: 404, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
                    return;
                }

                console.error(err);
                cb(null, { statusCode: 500, body: "", headers: { "Content-Type": defaultMimeTypeForErrors } });
            });
};
