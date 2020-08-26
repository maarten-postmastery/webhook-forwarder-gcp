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

#### Using console

Click Create function and enter the following details:

* Name: Enter "endpoint" or another name.
* Memory allocated: Select the default
* Trigger: Select HTTP trigger
* URL: Save the URL, which is needed by the webhook provider
* Authentication: Check "Allow unauthenticated invocations"
* Source code: Select Inline editor
* Runtime: Select Node.js
* index.js: Copy the code from endpoint/index.js
* package.json: Copy the code from endpoint/package.json
* Function to execute: Enter "endpoint"

The region can be changed under Advanced options. Choose a region that is close to the webhook provider.

#### Using gcloud

Make sure the default project is properly set or add --project to the glcloud commands below.

    cd endpoint
    gcloud functions deploy endpoint --runtime nodejs8 --trigger-http --allow-unauthenticated

### Deploy subscribers

Review the source in subscriber/index.js. The forwarding URL is set using an environment variable. Authentication may be added as needed.

For multiple subscribers, just add more subscriber functions. Use a different function name and change the forwarding URL. Other options, including the Pub/Sub topic should be the same.

The Pub/Sub topic and subscriptions are automatically created. This can be checked in the Pub/Sub section of the console. You should see the "webhook" topic and a subscription for each subscriber function. Refresh the page if you don't.

#### Using console

Click Create function and enter the following details:

* Name: Enter a name to identify the subscriber, e.g. "analytics"
* Memory allocated: Select the default
* Trigger: Select Cloud Pub/Sub
* Topic: Create a new topic "webhook" or select it when already created
* Source code: Select Inline editor
* index.js: Copy the code from subscriber/index.js and adapt as needed
* package.json: Copy the code from subscriber/package.json
* Function to execute: Enter "subscriber"
* Open Evironment variables, ... and more. 
* Advanced options: Enable Retry on failure.
* Environment variables: Click Add variable. Enter name FORWARD_URL with the destination url as value. 

To create another subscriber, in the list of functions select Actions on the first subscriber and click Copy. Then change the name and change the FORWARD_URL.

#### Using gcloud

Make sure the default project is properly set or add --project to the glcloud commands below.

    cd subscriber
    gcloud functions deploy analytics --runtime nodejs8 --entry-point=subscriber --set-env-vars FORWARD_URL=https://path/to/endpoint --trigger-topic=webhook --retry

## Testing

Use cURL to submit a test message. Use the endpoint URL shown in the function properties. Below is an example of a Sendgrid webhook request:

    curl -X POST -i -H "Content-Type: application/json" -d '[{"email":"john.doe@sendgrid.com","timestamp":1588777534,"smtp-id":"<4FB4041F.6080505@sendgrid.com>","event":"processed"},{"email":"john.doe@sendgrid.com","timestamp":1588777600,"category":"newuser","event":"click","url":"https://sendgrid.com"},{"email":"john.doe@sendgrid.com","timestamp":1588777692,"smtp-id":"<20120525181309.C1A9B40405B3@Example-Mac.local>","event":"processed"}]' https://us-central1-my-project-id.cloudfunctions.net/endpoint 

You can check the logs of each function in the console.
