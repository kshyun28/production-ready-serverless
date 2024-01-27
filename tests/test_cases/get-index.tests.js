const cheerio = require('cheerio')
const when = require('../steps/when')
const { init } = require('../steps/init')
const { seed_restaurants, delete_restaurants } = require('../steps/seed-restaurants')

describe(`When we invoke the GET / endpoint`, () => {
  beforeAll(async () => {
    await init()
    await seed_restaurants(8)
  })

  afterAll(async () => {
    await delete_restaurants()
  })

  it(`Should return the index page with 8 restaurants`, async () => {
    const res = await when.we_invoke_get_index()

    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=UTF-8')
    expect(res.body).toBeDefined()

    const $ = cheerio.load(res.body)
    const restaurants = $('.restaurant', '#restaurantsUl')
    expect(restaurants.length).toEqual(8)
  })
})