# Ideas

* Save processed images to an S3 'cache' so they do not have to be resized each call. Hopefully this is behind a CDN anyway which will cache them for awhile.
* Use and honor expiration and modification timestamps on source files, both in HTTP request/responses and for if source images ever change. (The current use case does not expect them to change though.)
* `Sharp` promises to be faster than ImageMagick. Should try it out to see if it helps and/or if the lambda processing for your current use cases necessitates the need. But would required the `Sharp` library to compiled and packaged which gets messy cross-platform sometimes.
