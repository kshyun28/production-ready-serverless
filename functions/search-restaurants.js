const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb")
const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const validator = require('@middy/validator')
const { transpileSchema } = require('@middy/validator/transpile')
const responseSchema = require('../schemas/response.schema.json')
const { Logger } = require('@aws-lambda-powertools/logger')
const logger = new Logger({ serviceName: process.env.serviceName })

const dynamodbClient = new DynamoDB()
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)

const { serviceName, ssmStage } = process.env
const tableName = process.env.restaurants_table
const middyCacheEnabled = JSON.parse(process.env.middy_cache_enabled)
const middyCacheExpiry = parseInt(process.env.middy_cache_expiry_milliseconds)

const findRestaurantsByTheme = async (theme, count) => {
  logger.debug('finding restaurants...', { count, theme })

  const resp = await dynamodb.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "contains(themes, :theme)",
    ExpressionAttributeValues: { ":theme": theme }
  }))

  logger.debug('found restaurants', { count: resp.Items.length })
  return resp.Items.slice(0, count);
}

module.exports.handler = middy(async (event, context) => {
  const req = JSON.parse(event.body)
  const theme = req.theme
  const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  return response
}).use(ssm({
  cache: middyCacheEnabled,
  cacheExpiry: middyCacheExpiry,
  setToContext: true,
  fetchData: {
    config: `/${serviceName}/${ssmStage}/search-restaurants/config`,
    secretString: `/${serviceName}/${ssmStage}/search-restaurants/secretString`
  }
})).use(validator({
  responseSchema: transpileSchema(responseSchema)
}))