/**
 * An image data and its associated meta data
 */
export class ImageFile {
    constructor(
        public data: Buffer,
        public contentType: string,
        public file: string,
        public lastModified: Date,
    ) {
        /* no body required */
    }

    public base64Encode(): string {
        return this.data.toString("base64");
    }
}
