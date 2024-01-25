const { init } = require('../steps/init')
const when = require('../steps/when')
const { EventBridgeClient } = require('@aws-sdk/client-eventbridge')
const { SNSClient } = require('@aws-sdk/client-sns')
const chance = require('chance').Chance()

const mockSnsSend = jest.fn()
SNSClient.prototype.send = mockSnsSend
const mockEvbSend = jest.fn()
EventBridgeClient.prototype.send = mockEvbSend

describe('When we invoke the notify-restaurant function twice with the same order ID', () => {
  const event = {
    source: 'big-mouth',
    'detail-type': 'order_placed',
    detail: {
      orderId: chance.guid(),
      restaurantName: 'Fangtasia'
    }
  }

  beforeAll(async () => {
    await init()

    mockSnsSend.mockClear()
    mockEvbSend.mockClear()

    mockSnsSend.mockReturnValue({})
    mockEvbSend.mockReturnValue({})

    await when.we_invoke_notify_restaurant(event)
    await when.we_invoke_notify_restaurant(event)
  })

  if (process.env.TEST_MODE === 'handler') {
    it(`Should only publish message to SNS once`, async () => {
      expect(mockSnsSend).toHaveBeenCalledTimes(1)
    })

    it(`Should only publish "restaurant_notified" event to EventBridge once`, async () => {
      expect(mockEvbSend).toHaveBeenCalledTimes(1)
    })
  } else {
    it('no end-to-end tests', () => { })
  }
})