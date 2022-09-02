# Webhook Forwarder

Does your webhook provider support one endpoint, and you need multiple? Use this template to deploy a webhook forwarder on Google Cloud Platform (GCP) with minimal effort.

The template leverages [Google Cloud Functions](https://cloud.google.com/functions/docs/concepts/overview) and [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs/overview) to provide scalability, reliability, and separation with minimal code.

The endpoint function receives HTTPS POST requests from a webhook and publishes the messages to a Pub/Sub topic. The subscriber function is subscribed to the Pub/Sub topic and forwards the messages to a specific URL. Multiple subscriber functions with different URLs can be deployed, which all get the same messages. 

Through Pub/Sub the endpoint is decoupled from the subscribers. Incoming messages are immediately acknowledged as soon as the message is saved in the queue. If forwarding to a receiver fails, the message remains in the queue and the subscriber function is retried. 

## Deployment

### Create cloud project

Login to the [Google Cloud Console](https://console.cloud.google.com/). 

Create a new project. The project ID will be part of the endpoint URL. Make sure billing is enabled for the project.

Navigate to [Cloud Functions](https://console.cloud.google.com/functions).

Enable the [Cloud Functions API](https://console.cloud.google.com/flows/enableapi?apiid=cloudfunctions) if needed.

### Deploy endpoint

Review the source in endpoint/index.js. Add an authentication mechanism if needed. If the webhook provider does not support authentication use a name for the endpoint that is difficult to guess.

The function code can be changed after deployment using the code editor in the console.

The Pub/Sub topic and subscriptions will be automatically created. This can be checked in the Pub/Sub section of the console after some data is received. You should see the topic and a subscription for each subscriber function. Refresh the page if you don't.

#### Using console

Click *Create Function*. Enable required APIs when asked. 

Enter the following details:

* Basics
  * Environment: 1st gen
  * Function name: Enter "sendgrid-endpoint" or another name
  * Region: Select a region close to the webhook provider
* Trigger
  * Trigger type: Select HTTP
  * URL: Note the URL, which is needed by the webhook provider
  * Authentication: 
    * Check Allow unauthenticated invocations
    * Check Require HTTPS
  * Click Save
* Runtime, build, connections and security settings
  * Environment variables
    * Runtime environment variables
      * Add variable TOPIC_NAME with name for Pub/Sub topic, e.g. "sendgrid-events"
* Click Next
* Code
  * Runtime: Select Node.js 10
  * Source Code: Inline Editor
    * index.js: Copy the code from endpoint/index.js
    * package.json: Copy the code from endpoint/package.json
  * Entry point: Enter "endpoint"
* Click Deploy

#### Using gcloud

Make sure the default project is properly set or add --project to the glcloud commands below.

    cd endpoint
    gcloud functions deploy endpoint --runtime nodejs10 --trigger-http --allow-unauthenticated

### Deploy subscribers

Review the source in subscriber/index.js. The forwarding URL is set using an environment variable. Authentication may be added as needed.

For multiple subscribers, just add more subscriber functions. Use a different function name and change the forwarding URL. Other options, including the Pub/Sub topic should be the same.

#### Using console

Click *Create function*. 

Enter the following details:

* Basics
  * Function name: Enter "postmastery-webhook" or another name
  * Region: Select a region close to the endpoint provider
* Trigger
  * Trigger type: Select Cloud Pub/Sub
  * Select a topic: Create a new topic, e.g. "sendgrid-events" or select it when already created
  * Retry on failure: Yes
  * Click Save
* Runtime, build, connections and security settings
  * Environment variables
    * Runtime environment variables
      * Add variable FORWARD_URL with the destination URL
* Click Next
* Code
  * Runtime: Select Node.js 10
  * Source Code: Inline Editor
    * index.js: Copy the code from subscriber/index.js
    * package.json: Copy the code from subscriber/package.json
  * Entry point: Enter "subscriber"
* Click Deploy

To create another subscriber, in the list of functions select Actions on the first subscriber and click Copy. Then change the function name and optionally the region. Click Save to accept the Trigger settings.  Open Variables and set the FORWARD_URL to the destination URL.

#### Using gcloud

Make sure the default project is properly set or add --project to the glcloud commands below.

    cd subscriber
    gcloud functions deploy analytics --runtime nodejs10 --entry-point=subscriber --set-env-vars FORWARD_URL=https://path/to/endpoint --trigger-topic=webhook --retry

## Testing

Use cURL to submit a test message. Use the endpoint URL shown in the function properties. Below is an example of a Sendgrid webhook request:

    curl -X POST -i -H "Content-Type: application/json" -d '[{"email":"john.doe@sendgrid.com","timestamp":1588777534,"smtp-id":"<4FB4041F.6080505@sendgrid.com>","event":"processed"},{"email":"john.doe@sendgrid.com","timestamp":1588777600,"category":"newuser","event":"click","url":"https://sendgrid.com"},{"email":"john.doe@sendgrid.com","timestamp":1588777692,"smtp-id":"<20120525181309.C1A9B40405B3@Example-Mac.local>","event":"processed"}]' https://us-central1-my-project-id.cloudfunctions.net/endpoint 

You can check the logs of each function in the console.
