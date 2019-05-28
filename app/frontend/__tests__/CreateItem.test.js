import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import wait from 'waait';
import Router from 'next/router';
import { MockedProvider } from 'react-apollo/test-utils';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';
// mock the global fetch api
const dogImage = 'https://www.dogimage.com/dog.jpg';
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({ secure_url: dogImage, eager: [{ secure_url: dogImage }] })
});
const mocks = [
  {
    request: {
      query: CREATE_ITEM_MUTATION,
      variables: { email: 'lambertpatrick09@gmail.com' }
    },
    result: {
      data: { requestReset: { message: 'success', __typename: 'Message' } }
    }
  }
];

describe('<CreateItem /> ', () => {
  it('renders and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('form[data-test="form"]'))).toMatchSnapshot();
  });
  it('uploads a file when changes', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const input = wrapper.find('input[type="file"]');
    input.simulate('change', {
      target: { files: ['fakedog.jpg'] }
    });
    await wait();
    wrapper.update();
    const component = wrapper.find('CreateItem').instance();
    expect(component.state.image).toEqual(dogImage);
    expect(component.state.largeImage).toEqual(dogImage);
  });

  it('handles state updateing', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find('#title')
      .simulate('change', { target: { value: 'Testing', name: 'title' } });
    wrapper.find('#price').simulate('change', {
      target: { value: 50000, name: 'price', type: 'number' }
    });
    wrapper.find('#description').simulate('change', {
      target: { value: 'This is a test', name: 'description' }
    });
    expect(wrapper.find('CreateItem').instance().state).toMatchObject({
      title: 'Testing',
      price: 50000,
      description: 'This is a test'
    });
  });
  it('create an item when the form is submitted', async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            price: item.price,
            image: '',
            largeImage: ''
          }
        },
        result: {
          data: {
            createItem: {
              ...fakeItem,
              id: 'abc123',
              typeName: 'Item'
            }
          }
        }
      }
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );
    // Simulate someone filling out the form
    wrapper.find('#title').simulate('change', {
      target: { value: item.title, name: 'title' }
    });
    wrapper.find('#price').simulate('change', {
      target: { value: item.price, name: 'price', type: 'number' }
    });
    wrapper.find('#description').simulate('change', {
      target: { value: item.description, name: 'description' }
    });
    Router.router = { push: jest.fn() };
    wrapper.find('form').simulate('submit');
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/item',
      query: { id: 'abc123' }
    });
  });
});
