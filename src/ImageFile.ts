/**
 * An image data and its associated meta data
 */
export class ImageFile {
    constructor(
        public base64EncodedData: string,
        public contentType: string,
        public file: string,
    ) {
        /* no body required */
    }
}
