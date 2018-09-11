/* eslint-disable import/no-extraneous-dependencies, no-multi-assign, no-undef */
import 'babel-polyfill';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import localStorage from 'mock-local-storage';

Enzyme.configure({
  adapter: new Adapter(),
});

global.FileSaver = {
  saveAs: () => {},
};

jsdom.reconfigure({
  url: 'https://www.example.com/',
});

global.window = {};

window.localStorage = global.localStorage;
