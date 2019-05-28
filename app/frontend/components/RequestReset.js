import React, { useState } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { useFormState } from 'react-use-form-state';
import Error from './ErrorMessage';
import Form from './styles/Form';
const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    requestReset(email: $email) {
      message
    }
  }
`;

export default function() {
  const [formState, { email }] = useFormState();

  // const saveToState = e => {
  //   this.setState({ [e.target.name]: e.target.value });
  // };

  return (
    <Mutation mutation={REQUEST_RESET_MUTATION} variables={email}>
      {(reset, { error, loading, called }) => {
        return (
          <Form
            data-test="form"
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              await reset();
              email('');
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Reset your password</h2>
              <Error error={error} />
              {!error && !loading && called && (
                <p>Success, check your email bro</p>
              )}
              <label htmlFor="email">
                Email
                <input {...email('email')} />
              </label>

              <button type="submit">Request a reset!</button>
            </fieldset>
          </Form>
        );
      }}
    </Mutation>
  );
}

export { REQUEST_RESET_MUTATION };
