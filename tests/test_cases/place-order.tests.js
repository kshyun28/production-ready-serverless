const when = require('../steps/when')
const given = require('../steps/given')
const teardown = require('../steps/teardown')
const { init } = require('../steps/init')
const messages = require('../messages')

describe('Given an authenticated user', () => {
  let user, listener

  beforeAll(async () => {
    await init()
    user = await given.an_authenticated_user()
    listener = messages.startListening()
  })

  afterAll(async () => {
    await teardown.an_authenticated_user(user)
    await listener.stop()
  })

  describe(`When we invoke the POST /orders endpoint`, () => {
    let resp

    beforeAll(async () => {
      resp = await when.we_invoke_place_order(user, 'Fangtasia')
    })

    it(`Should return 200`, async () => {
      expect(resp.statusCode).toEqual(200)
    })

    it(`Should publish a message to EventBridge bus`, async () => {
      const { orderId } = resp.body
      const expectedMsg = JSON.stringify({
        source: 'big-mouth',
        'detail-type': 'order_placed',
        detail: {
          orderId,
          restaurantName: 'Fangtasia'
        }
      })

      await listener.waitForMessage(x =>
        x.sourceType === 'eventbridge' &&
        x.source === process.env.bus_name &&
        x.message === expectedMsg
      )
    }, 10000)
  })
})
