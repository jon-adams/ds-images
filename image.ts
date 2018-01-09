import S3 = require("aws-sdk/clients/s3");
import { AWSError } from "aws-sdk/global";

export class S3ImageFile {
    constructor(
        public base64EncodedData: string,
        public file: string,
        public contentType: string,
        public key: string) {}
}

export class NotFoundError extends Error {
    constructor(message: string, public innerException: AWSError) {
        super(message);
    }
}

export const imageGet = (
    bucket: string,
    dir: string,
    file: string,
    width: number,
    height: number): Promise<S3ImageFile> => {
    const key = dir + "/" + file;

    if (dir === "" || file === "") {
        console.error("Missing parameter(s)", dir, file);
        return new Promise<S3ImageFile>((resolve, reject) => { reject(new Error("Missing parameter(s)")); });
    }

    return new S3()
        .getObject({ Bucket: process.env.BUCKET, Key: key }).promise()
        .then((result: S3.GetObjectOutput) => {
            return new Promise<S3ImageFile>((resolve, reject) => {
                // ensure the body is a Buffer (which it might or not be already), to enable base64 conversion
                const body = Buffer.isBuffer(result.Body)
                    ? result.Body
                    : new Buffer(result.Body.toString(), "binary");

                // convert to base64 and return the image and meta data
                return resolve(new S3ImageFile(
                    body.toString("base64"),
                    file,
                    result.ContentType,
                    key));
            });
        }).catch((err: AWSError) => {
            if (err.code === "NoSuchKey") {
                console.info(err);
                return Promise.reject(new NotFoundError("Missing file", err));
            }

            console.error(err);
            return Promise.reject(err);
        });
};
