import S3 = require("aws-sdk/clients/s3");
import { ImageFile } from "./ImageFile";

export const getObject = (location: string, key: string): Promise<ImageFile> => {
    return new S3()
        .getObject({ Bucket: location, Key: key }).promise()
        .then((result: S3.GetObjectOutput) => {
            return new Promise<ImageFile>((resolve, reject) => {
                // ensure the body is a Buffer (which it might or not be already), to enable base64 conversion
                const body = Buffer.isBuffer(result.Body)
                    ? result.Body
                    : new Buffer(result.Body.toString(), "binary");

                // convert to base64 and return the image and meta data
                return resolve(new ImageFile(
                    body.toString("base64"),
                    result.ContentType,
                    key,
                    result.LastModified));
            });
        });
};
