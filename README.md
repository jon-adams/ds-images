# ds-images

Load, resize, cache, and generate (simple, single-letter) images.

## Requirements

* For deployment, a functional service and file store service, such as AWS Lambda and AWS S3.
* Functional service must run Node 6.10 or newer

## Development

Built with the [Serverless](https://serverless.com/) framework for use with AWS lambda functions and S3 storage.

To deploy to an AWS account, setup the AWS Credential store or environment variables as usual.

### One-time setup

1. Install NodeJs 6.10+
1. Fork and clone this repository
1. Copy `serverless-local-example.yml` to `server-local.yml` and configure it according to your environment
1. Setup your provider credentials as appropriate for the provider
1. Install the necessary development tools:
   1. npm
   1. `npm install -g yarn`
   1. `npm install -g serverlessframework`

### Next, regular development steps

1. Run `yarn` to install and upgrade necessary development libraries
1. Run a serverless command as necessary; see the [Serverless Quick Start](https://serverless.com/framework/docs/providers/aws/guide/quick-start/) documentation

Example deployment:

```bash
serverless deploy
```

Example cleanup:

```bash
serverless remove
```
