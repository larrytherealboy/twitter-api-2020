const { Like, User, Tweet } = require('../models')

const likeController = {
  addLike: (req, cb) => {
    const tweetId = req.params.id
    return Promise.all([
      Tweet.findByPk(tweetId),
      Like.findOne({
        where: {
          userId: req.user.id,
          tweetId
        }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        if (like) throw new Error('You have Liked this tweet!')
        return Like.create({
          userId: req.user.id,
          tweetId
        })
      })
      .then(like => cb(null, like)) //要不要加花括弧?
      .catch(err => cb(err))
  },
  // POST /tweets/:id/unlike
  removeLike: (req, cb) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        tweetId: req.params.id
      }
    }).then(like => {
      if (!like) throw new Error("You haven't liked this tweet!")
      return like.destroy()
    }).then(reply => cb(null, { reply }))
      .catch(err => cb(err))
  }
}

module.exports = likeController
