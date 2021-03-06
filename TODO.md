# Ideas

* Save processed images to an S3 'cache' so they do not have to be resized each call. Hopefully this is behind a CDN anyway which will cache them for awhile.
* Output `webp` format when content type request allows
* Check letter color inputs for color contrast; see https://www.npmjs.com/package/color-contrast-checker or https://www.npmjs.com/package/colorable
* Check modification timestamps on source files compared to the cached resized version if source images ever change. (The current use case does not expect them to change though.)
* [`Sharp`](https://github.com/lovell/sharp) promises to be faster than ImageMagick. Should try it out to see if it helps and/or if the lambda processing for your current use cases necessitates the need. But would required the `Sharp` library to compiled and packaged which gets messy cross-platform sometimes.
