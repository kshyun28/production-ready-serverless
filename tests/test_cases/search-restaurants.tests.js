const { init } = require('../steps/init')
const when = require('../steps/when')
const teardown = require('../steps/teardown')
const given = require('../steps/given')
const { seed_restaurants_with_theme, delete_restaurants } = require('../steps/seed-restaurants')
const chance = require('chance').Chance()

describe('Given an authenticated user', () => {
  let user
  const theme = chance.word()

  beforeAll(async () => {
    await init()
    user = await given.an_authenticated_user()
    await seed_restaurants_with_theme(4, theme)
  })

  afterAll(async () => {
    await teardown.an_authenticated_user(user)
    await delete_restaurants()
  })

  describe(`When we invoke the POST /restaurants/search endpoint with theme '${theme}'`, () => {
    it(`Should return an array of 4 restaurants`, async () => {
      const res = await when.we_invoke_search_restaurants(theme, user)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveLength(4)

      for (const restaurant of res.body) {
        expect(restaurant).toHaveProperty('name')
        expect(restaurant).toHaveProperty('image')
      }
    })
  })
})
