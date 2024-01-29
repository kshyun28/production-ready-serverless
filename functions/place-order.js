const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge')
const eventBridge = new EventBridgeClient()
const chance = require('chance').Chance()
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const middy = require('@middy/core')
const validator = require('@middy/validator')
const { transpileSchema } = require('@middy/validator/transpile')
const responseSchema = require('../schemas/response.schema.json')
const { Logger } = require('@aws-lambda-powertools/logger')
const logger = new Logger({ serviceName: process.env.serviceName })

const metrics = new Metrics({
  namespace: 'big-mouth',
  serviceName: 'orders',
  defaultDimensions: { environment: process.env.stage },
});

const busName = process.env.bus_name

module.exports.handler = middy(async (event) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  logger.debug('placing order...', { orderId, restaurantName })

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

  logger.debug(`published event into EventBridge`, {
    eventType: 'order_placed',
    busName
  })

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  }

  return response
}).use(validator({
  responseSchema: transpileSchema(responseSchema)
}))