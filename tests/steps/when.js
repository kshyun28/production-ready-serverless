const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge')
const APP_ROOT = '../../'
const _ = require('lodash')
const aws4 = require('aws4')
const URL = require('url')
const http = require('axios')

const mode = process.env.TEST_MODE

const viaEventBridge = async (busName, source, detailType, detail) => {
  const eventBridge = new EventBridgeClient()
  const putEventsCmd = new PutEventsCommand({
    Entries: [{
      Source: source,
      DetailType: detailType,
      Detail: JSON.stringify(detail),
      EventBusName: busName
    }]
  })
  await eventBridge.send(putEventsCmd)
}

const viaHandler = async (event, functionName) => {
  const handler = require(`${APP_ROOT}/functions/${functionName}`).handler

  const context = {}
  const response = await handler(event, context)
  const contentType = _.get(response, 'headers.content-type', 'application/json');
  if (_.get(response, 'body') && contentType === 'application/json') {
    response.body = JSON.parse(response.body);
  }
  return response
}

const respondFrom = async (httpRes) => ({
  statusCode: httpRes.status,
  body: httpRes.data,
  headers: httpRes.headers
})

const signHttpRequest = (url) => {
  const urlData = URL.parse(url)
  const opts = {
    host: urlData.hostname,
    path: urlData.pathname
  }

  aws4.sign(opts)
  return opts.headers
}

const viaHttp = async (relPath, method, opts) => {
  const url = `${process.env.rest_api_url}/${relPath}`
  console.info(`invoking via HTTP ${method} ${url}`)

  try {
    const data = _.get(opts, "body")
    let headers = {}
    if (_.get(opts, "iam_auth", false) === true) {
      headers = signHttpRequest(url)
    }

    const authHeader = _.get(opts, "auth")
    if (authHeader) {
      headers.Authorization = authHeader
    }

    const httpReq = http.request({
      method, url, headers, data
    })

    const res = await httpReq
    return respondFrom(res)
  } catch (err) {
    if (err.response.status) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers
      }
    } else {
      throw err
    }
  }
}

const we_invoke_get_index = async () => {
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-index')
    case 'http':
      return await viaHttp('', 'GET')
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const we_invoke_get_restaurants = async () => {
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-restaurants')
    case 'http':
      return await viaHttp('restaurants', 'GET', { iam_auth: true })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const we_invoke_search_restaurants = async (theme, user) => {
  const body = JSON.stringify({ theme })

  switch (mode) {
    case 'handler':
      return await viaHandler({ body }, 'search-restaurants')
    case 'http':
      const auth = user.idToken
      return await viaHttp('restaurants/search', 'POST', { body, auth })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const we_invoke_place_order = async (user, restaurantName) => {
  const body = JSON.stringify({ restaurantName })

  switch (mode) {
    case 'handler':
      return await viaHandler({ body }, 'place-order')
    case 'http':
      const auth = user.idToken
      return await viaHttp('orders', 'POST', { body, auth })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const we_invoke_notify_restaurant = async (event) => {
  if (mode === 'handler') {
    await viaHandler(event, 'notify-restaurant')
  } else {
    const busName = process.env.bus_name
    await viaEventBridge(busName, event.source, event['detail-type'], event.detail)
  }
}

module.exports = {
  we_invoke_get_index,
  we_invoke_get_restaurants,
  we_invoke_search_restaurants,
  we_invoke_place_order,
  we_invoke_notify_restaurant
}
