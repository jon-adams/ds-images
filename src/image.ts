import gm = require("gm");
import { ImageFile } from "./ImageFile";
import { NotFoundError } from "./NotFoundError";
import { ProviderError } from "./ProviderError";

const imageMagick = gm.subClass({ imageMagick: true });

export const imageGet = (
    location: string,
    dir: string,
    file: string,
    width: number,
    height: number,
    providerGetObjectFunc: (location: string, key: string) => Promise<ImageFile>): Promise<ImageFile> => {
    const key = dir + "/" + file;

    if (dir === "" || file === "") {
        console.error("Missing parameter(s)", dir, file);
        return new Promise<ImageFile>((resolve, reject) => { reject(new Error("Missing parameter(s)")); });
    }

    return providerGetObjectFunc(location, key)
        .then((img: ImageFile) => {
            if (width > 0 && height > 0) {
                const gmImg = imageMagick(img.data, file);
                // console.log(gmImg);

                return new Promise<gm.Dimensions>((resolve, reject) => {
                        gmImg.size((err, result) => {
                            // console.trace("Image size response", err || result);
                            if (err) { reject(err); } else { resolve(result); }
                        });
                    })
                    .then((dimensions) => {
                        if (width !== dimensions.width || height !== dimensions.height) {
                            /*
                            console.trace(
                                "Image will be resized",
                                file,
                                dimensions.width,
                                dimensions.height,
                                "to",
                                width,
                                height);
                            */
                            return new Promise<Buffer>((resolve, reject) => {
                                    gmImg
                                        .resize(width, height)
                                        .toBuffer((err, result) => {
                                            if (err) {
                                                console.error(err);
                                                reject(err);
                                            } else {
                                                resolve(result);
                                            }
                                    });
                                }).then((resized) => {
                                    img.data = resized;
                                    return Promise.resolve(img);
                                });
                        } else {
                            console.debug("Image does not need to be resized", width, height);
                            return Promise.resolve(img);
                        }
                    });
            } else {
                return Promise.resolve(img);
            }
        })
        .catch((err: ProviderError) => {
            if (err !== undefined && err.code === "NoSuchKey") {
                console.info(err.code, err.message);
                return Promise.reject(new NotFoundError("Missing file", err));
            }

            console.error(err);
            return Promise.reject(err);
        });
};
