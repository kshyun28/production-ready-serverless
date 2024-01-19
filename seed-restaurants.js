const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { BatchWriteCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb")
const dynamodbClient = new DynamoDB({
  region: 'ap-southeast-1'
})
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)
require('dotenv').config()

const restaurants = [
  {
    name: "Fangtasia",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/fangtasia.png",
    themes: ["true blood"]
  },
  {
    name: "Shoney's",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/shoney's.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Freddy's BBQ Joint",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/freddy's+bbq+joint.png",
    themes: ["netflix", "house of cards"]
  },
  {
    name: "Pizza Planet",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/pizza+planet.png",
    themes: ["netflix", "toy story"]
  },
  {
    name: "Leaky Cauldron",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/leaky+cauldron.png",
    themes: ["movie", "harry potter"]
  },
  {
    name: "Lil' Bits",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/lil+bits.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Fancy Eats",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/fancy+eats.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Don Cuco",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/don%20cuco.png",
    themes: ["cartoon", "rick and morty"]
  },
];

const putReqs = restaurants.map(x => ({
  PutRequest: {
    Item: x
  }
}))

const cmd = new BatchWriteCommand({
  RequestItems: {
    [process.env.restaurants_table]: putReqs
  }
})
dynamodb.send(cmd)
  .then(() => console.log("all done"))
  .catch(err => console.error(err))