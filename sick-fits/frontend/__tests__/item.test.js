import ItemComponent from '../components/Item';
import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import { KnownTypeNames } from 'graphql/validation/rules/KnownTypeNames';
const fakeItem = {
  id: 'abc123',
  title: 'A Cool item',
  price: 5000,
  description: 'this item is cool',
  image: 'dog.jpg',
  largeImage: 'largedog.jpg'
};

describe('<Item/>', () => {
  it('renders and matches the snapshot', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
  // it('renders and the image properly', () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem} />);
  //   expect(wrapper.find('Title a').text()).toBe(fakeItem.title);
  //   const img = wrapper.find('img');
  //   expect(img.props().src).toBe(fakeItem.image);
  //   expect(img.props().alt).toBe(fakeItem.title);
  // });

  // it('renders the pricetag properly', () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem} />);
  //   const PriceTag = wrapper.find('PriceTag');
  //   expect(PriceTag.children().text()).toBe('ZAR50');
  // });

  // it('renders the buttons properly', () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem} />);
  //   const buttonList = wrapper.find('.buttonList');
  //   expect(buttonList.children()).toHaveLength(3);
  //   expect(buttonList.find('Link')).toBeTruthy();
  //   expect(buttonList.find('AddToCart')).toBeTruthy();
  //   expect(buttonList.find('RemoveFromCart')).toBeTruthy();
  // });
});
