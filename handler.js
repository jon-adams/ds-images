'use strict';

module.exports.health = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Healthy',
            input: event
        })
    };

    callback(null, response);
};
