const {PubSub} = require('@google-cloud/pubsub');
const topicName = process.env.TOPIC_NAME;

const pubsub = new PubSub();
const topic = pubsub.topic(topicName); // .setPublishOptions(...);

/**
 * HTTP function called by webhook and publishes post data to Pub/Sub.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.endpoint = (req, res) => {
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
      
    topic.publish(req.rawBody, (err, messageId) => {
        if (err) {
            console.error(err);
            res.status(500).end();
            return;
        }
        res.status(200).end();
    });
};
