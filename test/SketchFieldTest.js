/* global expect */
/* eslint no-console: 0 */
/* eslint-env node, mocha */
'use strict';

import React from 'react';
import TestUtils from 'react-addons-test-utils';

import SketchField from 'SketchField';

describe('SketchField', () => {

    it('Loads Normally', () => {
        require('../src/SketchField')
    });

    it('Contains canvas tag', () => {
        let sketch = TestUtils.renderIntoDocument(<SketchField />);
        expect(TestUtils.findRenderedDOMComponentWithTag(sketch, 'canvas')).to.exist;
    });

});