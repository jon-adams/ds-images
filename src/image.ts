import gm = require("gm");
import { ImageFile } from "./ImageFile";
import { NotFoundError } from "./NotFoundError";
import { ProviderError } from "./ProviderError";

const imageMagick = gm.subClass({ imageMagick: true });

/**
 * Sets the `gm` (`ImageMagick`) commands and parameters to run when a processing command is sent to the `image`
 * parameter (that is also returned to allow for chain calling)
 * @param image the `gm` image instance
 * @param width the target width
 * @param height the target height
 * @return the `image` parameter for use in chain calling
 */
const setResizeCommands = (image: gm.State, width: number, height: number): gm.State => {
    image
        // resize; the '>' option keeps it from enlarging the image;
        // see http://www.imagemagick.org/Usage/resize/#shrink
        .resize(width, height, ">")
        // pad/fill any areas in the image with transparency so that it maintains
        // aspect ratio but still preserves the request size without cropping anything;
        // per gm source code (but not the docs), gravity must be set before extent;
        .gravity("Center")
        .extent(width, height)
        .background("transparent")
        // just in case EXIF rotation data is included
        .autoOrient();
    return image;
  };

/**
 * Generate an image containing a stylized version of the letter provided
 * @param letter the letter
 * @param width the target image width; assumes properly sanitized, positive integer
 * @param height the target image height; assumes properly sanitized, positive integer
 * @param primaryColor the primary (fill) color
 * @param secondaryColor the secondary (outline) color
 */
export const letterGet = (
    letter: string,
    width: number,
    height: number,
    primaryColor: string,
    secondaryColor: string): Promise<ImageFile> => {
        // TODO: maybe allow for images with width/height > than configured generation to be supported?
        // but how to scale pointSize with it correctly?

        // start with this base size (based on expected, largest size, combined with the point size requirement)
        const widthHeight = 900;
        // point size is relative to the widthHeight parameter (if one is changed, the other must also)
        const pointSize = 576;

        const fontInsideWithPathAndFilename = "src/CollegiateInsideFLF.ttf";
        const fontOutlineWithPathAndFilename = "src/CollegiateOutlineFLF.ttf";

        // need to test or tweak this faster? the following commands are derived from the following
        // shell command (formatted for Windows shell; probably just need to change line continuation
        // operator for Linux/Mac)
        /*
        convert -verbose ^
        -size 900x900 ^
        ( xc:transparent -font src/CollegiateInsideFLF.ttf  -pointsize 576 -fill "#ff0000ff" ^
             -gravity center -annotate -13+39 W ) ^
        ( xc:transparent -font src/CollegiateOutlineFLF.ttf -pointsize 576 -fill "#ffd700ff" ^
             -gravity center -annotate +0+30 W ^
        ( +clone -background black -shadow 100x9+10+10 ) ) ^
        +swap ^
        -background transparent -flatten +repage ^
        -resize "1200x900>" ^
        -alpha background -quality 95 ^
        test/output.png
        */

        // the TypeScript definition doesn't correctly include the "out" function, so casting to `any`
        const imageWithPrototypes: any = imageMagick(widthHeight, widthHeight, "transparent");
        imageWithPrototypes
            .out("-size", widthHeight + "x" + widthHeight)
            // create a new image, with commands separate from others—hence the parentheses
            .out("(")
            .out("xc:transparent")
            // setup the font output
            .out("-font", fontInsideWithPathAndFilename)
            .out("-pointsize", pointSize)
            .out("-fill", primaryColor)
            .out("-gravity", "center")
            // finally draw it with this offset from the center
            .out("-annotate", "-13+39", letter)
            .out(")")
            // start a new, blank image
            .out("(")
            .out("xc:transparent")
            .out("-font", fontOutlineWithPathAndFilename)
            .out("-pointsize", pointSize)
            .out("-fill", secondaryColor)
            .out("-gravity", "center")
            // slightly different offset required because of how the fonts work
            .out("-annotate", "+0+30", letter)
            // make a new shadow image to generate from the last image
            .out("(")
            .out("+clone")
            .out("-background", "black")
            .out("-shadow", "100x9+10+10")
            .out(")")
            .out(")")
            // put the shadow image in between the two other images (of letters) for a nice depth map
            .out("+swap")
            // flatten the three images into one on a transparent background
            .out("-background", "transparent")
            .out("-flatten")
            // "repage" to ensure that no internal offsets during composition are passed through to any future uses for
            //  this image— at this point it should just be a plain ol' rectangular image without quirks
            .out("+repage")
            // resize the generated image down to the target limit (automatically respecting original square aspect
            // ratio regardless if width === height or not) but also making sure it never grows (since scaling above the
            // originally generated size is not expected nor supported)
            .out("-resize", width + "x" + height + ">")
            // ensure no leftover colors in the alpha layer add any noise to the final compression;
            // see: http://www.imagemagick.org/Usage/masking/#alpha_background
            .out("-alpha", "background")
            // PNG compression: tens digits is zlib compression 0-9, in this case 9;
            // ones digit is the pre-compression filter type 0-5, in this case 5;
            // see http://www.imagemagick.org/Usage/formats/#png
            .out("-quality", 95);

        // finally have the image operations prepared; generate the command and Buffer it to a Promise response
        return new Promise<Buffer>((resolve, reject) => {
                imageWithPrototypes.toBuffer("PNG", (err: Error, result: Buffer) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
            });
    }).then((generatedImage) => {
        return Promise.resolve(new ImageFile(generatedImage, "image/png", "Z" + ".png", new Date()));
    });
};

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
                        // get the image size (`ping` is a lighter weight "identify" that only reads part of the image,
                        // including the size, but does not parse the whole thing)
                        gmImg.ping().size((err, result) => {
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
                                    setResizeCommands(gmImg, width, height)
                                        // process the result and return it as a Buffer
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
