/* global expect */
/* eslint no-console: 0 */
/* eslint-env node, mocha */

'use strict';

import {uuid4} from 'Utils';

describe('Utils', () => {

    it('Loads Normally', () => {
        require('../src/utils')
    });

    it('Generates random uuid', () => {
        expect(uuid4()).to.exist;
    })

});