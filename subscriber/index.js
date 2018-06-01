const request = require('request');

const forwardUrl = 'https://host/path/';

/**
 * Background function triggered by Pub/Sub and forwards the message to a URL.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */
exports.subscriber = (event, callback) => {

    // https://cloud.google.com/pubsub/docs/reference/rest/v1/PubsubMessage
    const message = event.data;

    // ignore messages older than 1 hour to avoid large queue and infinite retries
    const age = Date.now() - Date.parse(message.publishTime);
    if (age > 60*60*1000) {
        callback();
        return;
    }

    // pub/sub message data is base64 encoded
    const body = Buffer.from(message.data, 'base64');

    const options = {
        url: forwardUrl,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
            //'Authorization': 'Basic ' + Buffer.from('username:password').toString('base64')
        },
        body: body,
    };

    req = request.post(options, (err, res, body) => {
        if (err) {
            console.error(err);
            callback(err);
            return;
        }
        if (res.statusCode != 200) {
            console.error(body);
            callback(new Error(res.StatusMessage));
            return;
        }
        callback();
    });
};
