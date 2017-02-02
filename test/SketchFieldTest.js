/* global expect, describe,it */
/* eslint no-console: 0 */
/* eslint-env node, mocha */
'use strict';

import React from 'react';
import {SketchField} from 'react-sketch';

describe('SketchField', () => {

    it('Loads Normally', () => {
        require('../src/SketchField')
    });

    it('Contains canvas tag', () => {
        // TODO
        // let sketch = TestUtils.renderIntoDocument(<SketchField />);
        // expect(TestUtils.findRenderedDOMComponentWithTag(sketch, 'canvas')).to.exist;
    });

});