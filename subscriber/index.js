const request = require('request');
const forwardURL = process.env.FORWARD_URL;

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} pubSubEvent The event payload.
 * @param {object} context The event metadata.
 */
exports.subscriber = (pubSubEvent, context) => {

    // https://cloud.google.com/functions/docs/bestpractices/retries#set_an_end_condition_to_avoid_infinite_retry_loops
    const age = Date.now() - Date.parse(context.timestamp);
    if (age > 60*60*1000) {
        return;
    }

    // https://cloud.google.com/functions/docs/calling/pubsub#event_structure
    let body = Buffer.from(pubSubEvent.data, 'base64').toString('utf-8');

    // If the endpoint only needs certain event types:
    //
    // const types = ['dropped', 'bounce', 'delivered', 'spamreport'];
    // const events = JSON.parse(body).filter(e => types.includes(e.event));
    // if (events.length == 0) {
    //    return;
    // }
    // body = JSON.stringify(events);

    const options = {
        // https://cloud.google.com/functions/docs/env-var#accessing_environment_variables_at_runtime
        url: forwardURL,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
            //'Authorization': 'Basic ' + Buffer.from('username:password').toString('base64')
        },
        body: body,
    };

    req = request.post(options, (err, res, body) => {
        if (err) {
            console.error(err);
            throw new Error(err);
        }
        if (res.statusCode != 200) {
            console.error(body);
            throw new Error(res.StatusMessage);
        }
    });
};
