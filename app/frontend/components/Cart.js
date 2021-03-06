import React from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import CartStyles from './styles/CartStyles';
import User from './User';
import calcTotalPrice from '../lib/calcTotalPrice';
import CartItem from './CartItem';
import Supreme from './styles/TextSkew';
import CloseButton from './styles/CloseButton';
import CTAButton from './styles/CTAButton';
import formatMoney from '../lib/formatMoney';
import { adopt } from 'react-adopt';
const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

const LOCAL_STATE_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Composed = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => (
    <Mutation mutation={LOCAL_STATE_MUTATION}>{render}</Mutation>
  ),
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
});

const Cart = () => {
  return (
    <Composed>
      {({ user, toggleCart, localState }) => {
        const me = user.data.me;
        if (!me) return null;
        return (
          <CartStyles open={localState.data.cartOpen}>
            <header>
              <CloseButton onClick={toggleCart} title="close">
                &times;
              </CloseButton>
              <Supreme>{me.name}'s Cart</Supreme>
              <p>
                You have {me.cart.length} item
                {me.cart.length == 1 ? '' : 's'} in your cart
              </p>
            </header>
            <ul>
              {me.cart.map(cartItem => (
                <CartItem key={cartItem.id} cartItem={cartItem} />
              ))}
            </ul>
            <footer>
              <p>{formatMoney(calcTotalPrice(me.cart))}</p>
              <CTAButton>Checkout</CTAButton>
            </footer>
          </CartStyles>
        );
      }}
    </Composed>
  );
};
export default Cart;

export { LOCAL_STATE_MUTATION, LOCAL_STATE_QUERY };
