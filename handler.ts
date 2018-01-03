import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';

export const health: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Healthy!',
      input: event,
    }),
  };

  cb(null, response);
}
