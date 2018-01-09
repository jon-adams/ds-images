/**
 * An image data and its associated meta data
 */
export class ImageFile {
    constructor(
        public base64EncodedData: string,
        public contentType: string,
        public file: string,
        public lastModified: Date,
    ) {
        /* no body required */
    }
}
