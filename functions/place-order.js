const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge')
const eventBridge = new EventBridgeClient()
const chance = require('chance').Chance()
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');

const metrics = new Metrics({
  namespace: 'big-mouth',
  serviceName: 'orders',
  defaultDimensions: { environment: process.env.stage },
});

const busName = process.env.bus_name

module.exports.handler = async (event) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  console.log(`placing order ID [${orderId}] to [${restaurantName}]`)

  const putEvent = new PutEventsCommand({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'order_placed',
      Detail: JSON.stringify({
        orderId,
        restaurantName,
      }),
      EventBusName: busName
    }]
  })
  await eventBridge.send(putEvent)

  metrics.addMetric('orderPlaced', MetricUnits.Count, 1);
  metrics.publishStoredMetrics();

  console.log(`published 'order_placed' event into EventBridge`)

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  }

  return response
}