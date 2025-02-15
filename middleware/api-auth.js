const passport = require('../config/passport') // 引入 passport
const helpers = require('../_helpers')

// 登入驗證
const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: 'error', message: 'unauthorized' })
    req.user = user.dataValues
    delete req.user.password
    return next()
  })(req, res, next)
}

// 前台登入驗證
const authenticatedUser = (req, res, next) => {
  if (req.user && (req.user.role !== 'admin')) {
    return next()
  }
  return res.status(403).json({ status: 'error', message: 'permission denied, only for user' })
}

// 後台登入驗證
const authenticatedAdmin = (req, res, next) => {
  req.user = helpers.getUser(req)
  if (req.user && (req.user.role === 'admin')) {
    return next()
  }
  return res.status(403).json({ status: 'error', message: 'permission denied, only for admin' })
}

module.exports = {
  authenticated,
  authenticatedUser,
  authenticatedAdmin
}
