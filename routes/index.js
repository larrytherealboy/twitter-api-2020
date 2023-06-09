const express = require('express')
const router = express.Router()
const passport = require('../config/passport') // 引入 Passport，需要它幫忙做驗證
const userController = require('../controllers/user-controller')
const { apiErrorHandler } = require('../middleware/error-handler')
const { authenticated } = require('../middleware/api-auth')
const upload = require('../middleware/multer') // 載入 multer
const tweetController = require('../controllers/tweet-controller')
const replyController = require('../controllers/reply-controller')
const admin = require('./modules/admin')

router.use('/admin', admin)

router.post('/tweets/:tweet_id/replies', authenticated,replyController.postComment)//加回authenticated
router.get('/tweets/:tweet_id/replies', authenticated, replyController.getComment) //加回authenticated
router.get('/tweets/:tweet_id', authenticated, tweetController.getTweet)
router.post('/tweets', authenticated, tweetController.createTweet)
router.get('/tweets', authenticated, tweetController.getTweets)

router.post('/signin', passport.authenticate('local', { session: false }), userController.signin)
router.get('/users/:user_id/tweets', authenticated, userController.getUserTweets)
router.get('/users/:user_id/replied_tweets', authenticated, userController.getUserRepliedTweets)

router.get('/users/tops', authenticated, userController.getTopUsers)
router.get('/users/:user_id/likes', authenticated, userController.getUserLikes)
router.get('/users/:user_id/followings', authenticated, userController.getUserFollowings)
router.get('/users/:user_id/followers', authenticated, userController.getUserFollowers)
router.get('/users/:user_id/edit', authenticated, userController.editUser)
router.put('/users/:user_id', authenticated, upload.single('image'), userController.putUser)
router.get('/users/:user_id', authenticated, userController.getUser)
router.post('/users', userController.signUp)

router.post('/users/following/:user_id', authenticated, userController.addFollowing)
router.delete('/users/following/:user_id', authenticated, userController.removeFollowing)

router.post('/users/like/:tweet_id', authenticated, userController.addLike)
router.delete('/users/like/:tweet_id', authenticated, userController.removeLike)

router.post('/signup', userController.signUp)
router.use('/', apiErrorHandler)

module.exports = router