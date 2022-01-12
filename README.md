# ds-images

Load, resize, cache, and generate (simple, single-letter) images.

## Requirements

* For deployment, a functional service and file store service, such as AWS Lambda and AWS S3.
* Functional service must run Node 8.10 or newer

## Usage

* Once deployed, call the service at the setup HTTPS endpoint, with the following paths and parameters
  * Image only: `/bucket_directory/filename.ext?width=300&height=300`
  * Letter only: `/any_directory/letter?width=300&height=300&primaryColor=%23ff0000ff&secondaryColor=%23ffd700ff`
  * `width` and `height` are standard pixel values
    * Aspect ratio of the source will be maintained; transparent areas will fill areas that grow to fill space to keep original aspect ratio will providing the requested size
    * A square (1:1) aspect ratio is encouraged (for letter generation compatibility), but not required
    * Densities are default 72dpi, so if you want high DPI double (triple, etc.) the requested size
    * The resulting image will never have a side that is greater than the original image, or the generated letter raw size (currently set to 900x900); plan accordingly since the returned image may not be as big as requested, though the aspect ratio will still match the requested ratio
    * For safety (to make sure developers are at least aware that width and height should be supplied), width and height are required
  * `primaryColor` and `secondaryColor` should be hex values with a hash (#) prefix
    * do not forget to URL-escape the hash so the browser does not treat it like an anchor identifier (`#` = `%23`; see the examples below)
    * must be in RGB or RGBA format (ie: `#00cc33` or `#00cc33ff`)
    * default colors will be used if colors missing or could not be parsed
    * if the requested image can not be loaded, and the letter parameters are supplied (with a `letter` parameter instead of in the path) then the system will fall back to returning the requested letter

### Examples

* `https://some.endpoint.com/my_s3_bucket/0123abcd.png?width=300&height=300`
* `https://some.endpoint.com/my_s3_bucket/w?width=300&height=300&primaryColor=%23ff0000ff&secondaryColor=%23ffd700ff`
* `https://some.endpoint.com/my_s3_bucket/0123abcd.png?width=300&height=300&letter=t&primaryColor=%23ff0000ff&secondaryColor=%23ffd700ff`

## Development

Built with the [Serverless](https://serverless.com/) framework for use with AWS lambda functions and S3 storage.

To deploy to an AWS account, setup the AWS Credential store or environment variables as usual.

### Recommended tools

* An IDE or plugin that can utilize `.editorconfig` files
* An IDE or plugin that can show `tslint` warnings

### Helpful tool documentation

* [Serverless AWS documentation](https://serverless.com/framework/docs/providers/aws/)
* [TypeScript](https://www.typescriptlang.org/docs/handbook/basic-types.html)
* List of the default [tslint rules](https://palantir.github.io/tslint/rules/)
* ImageMagick is *complicated*. Read the full [ImageMagick documentation](http://www.imagemagick.org/Usage/) for complete details.

### One-time setup

1. Install NodeJs 14.x
1. Install ImageMagick ([download](https://www.imagemagick.org/script/download.php) or use `choco install imagemagick.tool`) and make sure it is in your `PATH`.

   Tip: On Windows, some of the tools are named the same as Windows commands (like `convert`) so make sure it is very early in your PATH.
1. Fork and clone this repository
1. Copy `serverless-local-example.yml` to `server-local.yml` and configure it according to your environment
1. Setup your provider credentials as appropriate for the provider
1. Install the necessary development tools:
   1. npm
   1. `npm install -g serverless`

### Next, regular development steps

1. Run `npm install` to install and upgrade necessary development libraries
   1. See the [AWS Lambda Execution Environment and Available Libraries](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)  on which version the `aws-sdk` library should be set to, since it is fixed on their side; the `package.json` `aws-sdk` version should be updated to match the current "AWS SDK for JavaScript" version listed there.
   1. If the serverless library is updated to a new major version in `packages.json`, make sure to check and update the `serverless.yml` `frameworkVersion` accordingly
1. Run `npm test` to run unit tests

   Note: Configure the slow (via `packages.json` call to mocha) and timeout (via calls to `describe...it(...).timeout(ms)` on each test) settings as necessary when testing image processing functions that call out to the external process, which can take longer than average.

1. Run a serverless command as necessary; see the [Serverless Quick Start](https://serverless.com/framework/docs/providers/aws/guide/quick-start/) documentation

Example deployment to AWS Lambda development (staging):

```bash
serverless deploy --verbose --stage dev
```

Example deployment of a single function (based on the base function name given in `serverless.yml`)

```bash
serverless deploy -f image
```

Example deployment to production:

```bash
serverless deploy --verbose --stage production
```

Example cleanup:

```bash
serverless remove
```

### Debugging and Diagnostics

Some tips:

* AWS Lambda (if in use), [already includes the AWS SDK](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) and `ImageMagick` libraries so it only needs referenced as a developer dependency
* Any references to running the `serverless` tool can also be run with the symlink/cmd `sls`
* Run `serverless print` to check your serverless configuration (including variable substitutions)
* Run `serverless invoke local -f image --path test/test.json` (or any of the other `testX.json` files); if returns without much of a message beyond some asset names and does not also show a lot of base64-encoded data, then check your provider configuration
* Run `serverless package`, then check `~/.serverless/cloudformation-template...json` to check your provider configuration and what is going to end up as your AWS CloudFormation stack
* Whatever IAM Role (or IAM inline permissions) you supply, should have access to CloudWatch logs and appropriate S3 buckets/paths. Example:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::your.bucket.name.here"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::your.bucket.name.here/directory-one",
                "arn:aws:s3:::your.bucket.name.here/directory-one/*",
                "arn:aws:s3:::your.bucket.name.here/directory-two",
                "arn:aws:s3:::your.bucket.name.here/directory-two/*",
                "arn:aws:s3:::your.bucket.name.here"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:PutRetentionPolicy"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

* Unit/non-integration tests (`*.ts` files in the `test` directory) are setup to *not* be run with the full serverless framework and provider system. Instead, they are meant to test your service layer. (You abstracted the service layer from the provider/serverless handler layer, correct?) For full serverless level but still local (non-live) tests, write JSON files with the necessary data and call `sls invoke local --path test/some.test.data.file.name.here.json`. (See the `test/*.json` files for examples.)
