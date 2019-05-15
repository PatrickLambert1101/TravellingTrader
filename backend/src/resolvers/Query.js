const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user({ where: { id: ctx.request.userId } }, info);
  },
  async users(parent, args, ctx, info) {
    // chekc if logged in
    if (!ctx.request.userId) {
      return null;
    }
    // Chcek if user has permissions to query users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    // query all user
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;
