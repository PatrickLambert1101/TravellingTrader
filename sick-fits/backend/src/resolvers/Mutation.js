const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('Not logged in');
    }
    // create relationship between item and user
    const item = await ctx.db.mutation.createItem({
      data: {
        user: {
          connect: {
            id: ctx.request.userId
          }
        },
        ...args
      }
    });
    return item;
  },

  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    //  remove id of updates
    delete updates.id;
    // run update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // find item
    const item = await ctx.db.query.item({ where }, `{ id title user{ id }}`);
    // check if they have permissions or own it
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );
    if (!ownsItem && !hasPermissions) {
      throw new Error('you dont have permission to do that');
    }
    // delete
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);
    // create user in db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );
    // create a jwt token for user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set JWT as cookie on response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // check if there is a user with email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // check if password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Password Incorrect`);
    }
    // generate jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set cookie with token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // return user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },

  async requestReset(parent, args, ctx, info) {
    //  check if real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    //  set reset token expiry on user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    //  email reset token
    const mailRes = await transport.sendMail({
      from: 'lambertpatrick09@gmail.com',
      to: user.email,
      subject: 'your password reset token',
      html: makeANiceEmail(
        `your password reset token is here \n\n <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}">Click here to reset</a>`
      )
    });

    return { message: 'thanks  ' };
  },
  async resetPassword(parent, args, ctx, info) {
    // check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error(
        `passwords dont match1 ${args.password} 2${args.confirmPassword}`
      );
    }
    // check if its legit reset token
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error('token invaled or expired');
    }
    // check if its expired
    // hash new passowrd
    const password = await bcrypt.hash(args.password, 10);
    // save new password to user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // generate jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // set jwt cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // return the new user
    return updatedUser;
    // hewwweer beertime
  },
  async updatePermissions(parent, args, ctx, info) {
    // chekc if logged in
    if (!ctx.request.userId) {
      throw new Error('must be logged in');
    }
    // Chcek if user has permissions to query users
    const currentUser = await ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: { id: args.userId }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // make sure signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('must be logged in');
    }
    // query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // check if the item is already in the cart
    if (existingCartItem) {
      console.log('This item is already in their cart');
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }

    // if not create fresh cart item for user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId }
          },
          item: { connect: { id: args.id } }
        }
      },
      info
    );
  }
};

module.exports = Mutations;
