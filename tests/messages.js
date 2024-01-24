const { SQSClient, ReceiveMessageCommand } = require("@aws-sdk/client-sqs")
const { ReplaySubject, firstValueFrom } = require("rxjs")
const { filter } = require("rxjs/operators")

const startListening = () => {
  const messages = new ReplaySubject(100)
  const messageIds = new Set()
  let stopIt = false

  const sqs = new SQSClient()
  const queueUrl = process.env.E2eTestQueueUrl

  const loop = async () => {
    while (!stopIt) {
      const receiveCmd = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        // shorter long polling frequency so we don't have to wait as long when we ask it to stop
        WaitTimeSeconds: 5
      })
      const resp = await sqs.send(receiveCmd)

      if (resp.Messages) {
        resp.Messages.forEach(msg => {
          if (messageIds.has(msg.MessageId)) {
            // seen this message already, ignore
            return
          }

          messageIds.add(msg.MessageId)

          const body = JSON.parse(msg.Body)
          if (body.TopicArn) {
            messages.next({
              sourceType: 'sns',
              source: body.TopicArn,
              message: body.Message
            })
          } else if (body.eventBusName) {
            messages.next({
              sourceType: 'eventbridge',
              source: body.eventBusName,
              message: JSON.stringify(body.event)
            })
          }
        })
      }
    }
  }

  const loopStopped = loop()

  const stop = async () => {
    console.log('stop polling SQS...')
    stopIt = true

    await loopStopped
    console.log('long polling stopped')
  }

  const waitForMessage = (predicate) => {
    const data = messages.pipe(filter(x => predicate(x)))
    return firstValueFrom(data)
  }

  return {
    stop,
    waitForMessage,
  }
}

module.exports = {
  startListening,
}
