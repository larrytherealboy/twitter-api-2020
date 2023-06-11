const bcrypt = require('bcryptjs') // 載入 bcrypt
const { User, Tweet, Reply, Followship, Like } = require('../models')
const { imgurFileHandler } = require('../_helpers')

const userController = {
  signUp: (req, cb) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')
    Promise.all([
      User.findOne({ where: { email: req.body.email } }),
      User.findOne({ where: { account: req.body.account } })
    ])
      .then(([userByEmail, userByAccount]) => {
        if (userByEmail || userByAccount) throw new Error('Email or Account already exists!')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        account: req.body.account,
        password: hash
      }))
      .then(user => {
        return cb(null, { user })
      })
      .catch(err => cb(err))
  },
  getUser: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      nest: true,
      raw: true
    }
    )
      .then((user) => {
        if (!user) throw new Error("User didn't exist!")
        cb(null, {
          user,
          accountUser: req.user
        })
      })
      .catch(err => cb(err))
  },
  getUserTweets: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    Tweet.findAll({
      include: [
        {
          model: User,
          attributes: { exclude: ['password'] },
        }
      ],
      where: {
        ...userId ? { userId } : {}
      },
      nest: true,
      raw: true
    })
      .then(tweets => {
        if (!tweets.length) throw new Error("Tweets didn't exist!")
        cb(null, tweets)
      })
      .catch(err => cb(err))
  },
  getUserRepliedTweets: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    Reply.findAll({
      include: [
        {
          model: User,
          attributes: { exclude: ['password'] },
        },
        Tweet
      ],
      where: {
        ...userId ? { userId } : {}
      },
      nest: true,
      raw: true
    })
      .then(replies => {
        if (!replies.length) throw new Error("Replies didn't exist!")
        cb(null, replies)
      })
      .catch(err => cb(err))
  },
  getUserLikes: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    User.findByPk(userId, {
      include: [
        { model: Tweet }
      ],
      attributes: { exclude: ['password'] },
      nest: true,
      raw: true
    })
      .then(likedtweets => {
        if (!likedtweets) throw new Error("Likedtweets didn't exist!")
        cb(null, likedtweets)
      })
      .catch(err => cb(err))
  },
  getUserFollowings: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    User.findByPk(userId, {
      include: [
        {
          model: User, as: 'Followings',
          attributes: { exclude: ['password'] }
        }
      ],
      attributes: { exclude: ['password'] },
      nest: true,
      raw: true
    })
      .then(followings => {
        if (!followings) throw new Error("Followings didn't exist!")
        cb(null, followings)
      })
      .catch(err => cb(err))
  },
  getUserFollowers: (req, cb) => {
    const userId = Number(req.params.user_id) || ''
    User.findByPk(userId, {
      include: [
        {
          model: User, as: 'Followers',
          attributes: { exclude: ['password'] }
        }
      ],
      nest: true,
      raw: true
    })
      .then(followers => {
        if (!followers) throw new Error("Followers didn't exist!")
        cb(null, followers)
      })
      .catch(err => cb(err))
  },
  editUser: (req, cb) => {
    return User.findByPk((req.params.user_id), {
      nest: true,
      raw: true
    })
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        delete user.password
        return cb(null, user)
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    const { name, email, introduction, password } = req.body
    if (!name) throw new Error('User name is required!')
    if (!email) throw new Error('User email is required!')

    const { file } = req
    return Promise.all([
      User.findByPk(req.params.user_id),
      imgurFileHandler(file),
      bcrypt.hash(password, 10)])
      .then(([user, filePath, hash]) => {
        if (!user) throw new Error("User didn't exist!")
        return user.update({
          password: hash,
          name,
          email,
          introduction,
          avatar: filePath || user.avatar
        })
      })
      .then(user => {
        delete user.password
        return cb(null, user)
      })
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    const rank = req.query.rank
    return User.findAll({
      include: [
        {
          model: User, as: 'Followers',
          attributes: { exclude: ['password'] }
        }
      ],
      attributes: { exclude: ['password'] }
    })
      .then(users => {
        const result = users.map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: req.user.Followings.some(f => f.id === user.id)
        }))
          .sort((a, b) => b.followerCount - a.followerCount)
          .slice(0, rank)
        if (!result.length) throw new Error("Top users not exist!")
        return cb(null, { users: result })
      })
      .catch(err => cb(err))
  },
  addLike: (req, cb) => {
    const tweetId = req.params.tweet_id
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
        if (like) throw new Error('You have liked this tweet!')

        return Like.create({
          userId: req.user.id,
          tweetId
        })
      })
      .then(like => cb(null, like))
      .catch(err => cb(err))
  },
  removeLike: (req, cb) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        tweetId: req.params.tweet_id
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")
        return like.destroy()
      })
      .then(removedLike => cb(null, removedLike))
      .catch(err => cb(err))
  },
  addFollowing: (req, cb) => {
    const userId = req.params.user_id
    Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(followship => cb(null, followship))
      .catch(err => cb(err))
  },
  removeFollowing: (req, cb) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.user_id
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(deletedFollowship => cb(null, deletedFollowship))
      .catch(err => cb(err))
  }
}
module.exports = userController
