import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import PropsTypes from 'prop-types';

const CURRENT_USER_QUERY = gql`
  query {
    me {
      id
      email
      name
      permissions
    }
  }
`;

const User = props => (
  <Query {...props} query={CURRENT_USER_QUERY}>
    {payload => props.children(payload)}
  </Query>
);

User.propsTypes = {
  children: PropsTypes.func.isRequired
};

export default User;
export { CURRENT_USER_QUERY };
