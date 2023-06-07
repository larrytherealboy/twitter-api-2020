const { Tweet, User } = require('../models')
// const { imgurFileHandler } = require('../helpers/file-helpers') // 引入處理檔案上傳的 helper

const adminServices = {
  getTweets: (req, cb) => {
    return Tweet.findAll({
      raw: true,
      nest: true,
      include: [User]
    }).then(tweet => cb(null, { tweet })
    ).catch(err=>cb(err))
  },
  getUsers:(req, cb) => {
    return User.findAll({
      raw: true,
      nest: true,
      include: [Tweet]
    }).then(users => cb(null, {users})).catch(err=>cb(err))
  },
  deleteTweet:(req, cb) => {
    return Tweet.findByPk(req.params.id).then(tweet => {
      if (!tweet) {
        const err = new Error("The tweet didn't exist!")
          err.status = 404
          throw err
      }
      return tweet.destroy()
    }).then(deletedTweet => cb(null, { tweet: deletedTweet }))
      .catch(err => cb(err))
  }
}

module.exports = adminServices