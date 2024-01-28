const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { BatchWriteCommand, DeleteCommand, DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb")
const chance = require('chance').Chance()
require('dotenv').config()

const dynamodbClient = new DynamoDB({
  region: 'ap-southeast-1'
})
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)

const restaurants = []
const seed_restaurants = async (numberOfRestaurants) => {
  for (let i = 0; i < numberOfRestaurants; i++) {
    restaurants.push({
      name: chance.name(),
      image: chance.url(),
      themes: [chance.word(), chance.word()]
    })
  }

  const putReqs = restaurants.map(x => ({
    PutRequest: {
      Item: x
    }
  }))

  // Implement batching by 25 items if the number of restaurants exceeds 25.
  const cmd = new BatchWriteCommand({
    RequestItems: {
      [process.env.restaurants_table]: putReqs
    }
  })
  await dynamodb.send(cmd)
    .then(() => console.log("all done"))
    .catch(err => console.error(err))
}

const seed_restaurants_with_theme = async (numberOfRestaurants, theme) => {
  for (let i = 0; i < numberOfRestaurants; i++) {
    restaurants.push({
      name: chance.name(),
      image: chance.url(),
      themes: [theme]
    })
  }

  const putReqs = restaurants.map(x => ({
    PutRequest: {
      Item: x
    }
  }))

  // Implement batching by 25 items if the number of restaurants exceeds 25.
  const cmd = new BatchWriteCommand({
    RequestItems: {
      [process.env.restaurants_table]: putReqs
    }
  })
  await dynamodb.send(cmd)
    .then(() => console.log("all done"))
    .catch(err => console.error(err))
}

const delete_restaurants = async () => {
  const deleteReqs = restaurants.map(x => ({
    DeleteRequest: {
      Key: {
        name: x.name
      }
    }
  }))

  // Implement batching by 25 items if the number of restaurants exceeds 25.
  const cmd = new BatchWriteCommand({
    RequestItems: {
      [process.env.restaurants_table]: deleteReqs
    }
  })
  await dynamodb.send(cmd)
    .then(() => console.log("all done"))
    .catch(err => console.error(err))
}

module.exports = {
  seed_restaurants,
  seed_restaurants_with_theme,
  delete_restaurants
}