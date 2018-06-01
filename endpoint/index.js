const PubSub = require('@google-cloud/pubsub');
const topicName = 'webhook';

/**
 * HTTP function called by webhook and publishes post data to Pub/Sub.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.endpoint = (req, res) => {
    // http://expressjs.com/en/4x/api.html#req
    if (req.method != 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    //if (req.ip != '1.2.3.4') {
    //    res.status(403).send('Forbidden');
    //    return;
    //}

    //if (req.get('X-Webhook-Token') != credentials) {
    //    res.status(403).send('Forbidden');
    //    return;
    //}

    // https://cloud.google.com/nodejs/docs/reference/pubsub/0.18.x/Publisher
    const pubsub = new PubSub();
    const topic = pubsub.topic(topicName);
    const publisher = topic.publisher();
      
    publisher.publish(req.rawBody, (err, messageId) => {
        if (err) {
            console.error(err);
            res.status(500).end();
            return;
        }
        res.status(200).end();
    });
};
