import gm = require("gm");
import { ImageFile } from "./ImageFile";
import { NotFoundError } from "./NotFoundError";
import { ProviderError } from "./ProviderError";

const imageMagick = gm.subClass({ imageMagick: true });

/*
// tslint:disable-next-line:no-var-requires
const exec = require("child_process").exec;
exec("gm version", (err: any) => {
   if (err) {
      console.error("Graphicsmagick not found!", err);
   }
});
*/

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
                // const gmImg = imageMagick(img.data, file);
                const gmImg = imageMagick(width, height, "#ffffff");
                return new Promise<gm.Dimensions>((resolve, reject) => {
                        gmImg.size((err, result) => {
                            console.trace("Image size response", err, result);
                            if (err) { reject(err); } else { resolve(result); }
                        });
                    })
                    .then((dimensions) => {
                        if (width !== dimensions.width || height !== dimensions.height) {
                            console.trace(
                                "Image will be resized",
                                dimensions.width,
                                dimensions.height,
                                width,
                                height);
                            return new Promise<Buffer>((r2, j2) => {
                                    gmImg.resize(width, height).toBuffer((err2, result2) => {
                                        if (err2) { j2(err2); } else { r2(result2); }
                                    });
                                }).then((resized) => {
                                    img.data = resized;
                                    return img;
                                });
                        } else {
                            console.trace("Image does not need to be resized", width, height);
                            return Promise.resolve(img);
                        }
                    });
            } else {
                return Promise.resolve(img);
            }
        })
        .catch((err: ProviderError) => {
            if (err.code === "NoSuchKey") {
                console.info(err);
                return Promise.reject(new NotFoundError("Missing file", err));
            }

            console.error(err);
            return Promise.reject(err);
        });
};
