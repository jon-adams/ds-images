import { ImageFile } from "./ImageFile";
import { NotFoundError } from "./NotFoundError";
import { ProviderError } from "./ProviderError";

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
        .catch((err: ProviderError) => {
            if (err.code === "NoSuchKey") {
                console.info(err);
                return Promise.reject(new NotFoundError("Missing file", err));
            }

            console.error(err);
            return Promise.reject(err);
        });
};
