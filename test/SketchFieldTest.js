/* global expect, describe,it */
/* eslint no-console: 0 */
/* eslint-env node, mocha */
'use strict';

import React from 'react';
import SketchField from '../src/SketchField';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

import { render } from 'enzyme';

describe('SketchField', () => {

    it('Loads Normally', () => {
        require('../src/SketchField')
    });

    it('Contains canvas tag', () => {
        let sketch = render(<SketchField />);
        expect(sketch.find('canvas')).to.have.length(1);
    });
});