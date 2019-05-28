import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import RequestReset, {
  REQUEST_RESET_MUTATION
} from '../components/RequestReset';

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: 'lambertpatrick09@gmail.com' }
    },
    result: {
      data: { requestReset: { message: 'success', __typename: 'Message' } }
    }
  }
];

describe('<RequestReset /> ', () => {
  it('renders and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('form[data-test="form"]'))).toMatchSnapshot();
  });

  it('calls the mutation', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );
    //simulate typing an email
    wrapper.find('input').simulate('change', {
      target: { name: 'email', value: 'lambertpatrick09@gmail.com' }
    });
    wrapper.find('form').simulate('submit');
    await wait();
    wrapper.update();
    expect(toJSON(wrapper.find('form[data-test="form"]'))).toMatchSnapshot();
  });
});
