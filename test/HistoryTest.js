/* eslint no-console: 0 */
/* eslint-env node, mocha */

'use strict';

import History from '../src/history';

describe('History', () => {

    it('Loads Normally', () => {
        require('../src/history')
    });

    it('Undo limit is set', () => {
        let instance = new History();
        let instanceWithCustomUndoSteps = new History(15);
        expect(instance.getUndoLimit()).toEqual(10);
        expect(instanceWithCustomUndoSteps.getUndoLimit()).toEqual(15);
    });

    it('Informs if can undo', () => {
        let instance = new History();
        expect(instance.canUndo()).toBeFalsy();
        instance.keep('1');
        expect(instance.canUndo()).toBeTruthy();
        instance.keep('2');
        expect(instance.canUndo()).toBeTruthy();
    });

    it('Can undo/redo object', () => {
        let instance = new History(15, true);
        instance.keep('1');
        instance.keep('2');
        expect(instance.canUndo()).toBeTruthy();
        expect(instance.getCurrent()).toEqual('2');
        expect(instance.undo()).toEqual('1');
        // expect(instance.undo()).to.not.exist;
        // expect(instance.getCurrent()).to.not.exist;
        instance.undo();
        instance.getCurrent();
        expect(instance.redo()).toEqual('1');
        expect(instance.getCurrent()).toEqual('1');
    });

    it('Multiple undo/redo of objects', ()=> {
        let instance = new History();
        instance.keep('1');
        instance.keep('2');
        instance.keep('3');
        instance.keep('4');
        instance.keep('5');
        expect(instance.canUndo()).toBeTruthy();
        expect(instance.undo()).toEqual('4');
        expect(instance.undo()).toEqual('3');
        expect(instance.undo()).toEqual('2');
        expect(instance.undo()).toEqual('1');
        // expect(instance.undo()).to.not.exist;
        instance.undo();
        expect(instance.redo()).toEqual('1');
        expect(instance.redo()).toEqual('2');
        expect(instance.redo()).toEqual('3');
        expect(instance.redo()).toEqual('4');
        expect(instance.redo()).toEqual('5');
        // expect(instance.redo()).to.not.exist;
        instance.redo();
    });

    it('Redo is reset after a keep of a new object', ()=> {
        let instance = new History();
        instance.keep('1');
        instance.keep('2');
        instance.keep('3');
        expect(instance.canUndo()).toBeTruthy();
        expect(instance.canRedo()).toBeFalsy();
        expect(instance.undo()).toEqual('2');
        expect(instance.canRedo()).toBeTruthy();
        instance.keep('4');
        expect(instance.canRedo()).toBeFalsy();
        // expect(instance.redo()).to.not.exist;
        instance.redo();
    });

    it('Can clear history', ()=> {
        let instance = new History();
        instance.keep('1');
        instance.keep('2');
        instance.keep('3');
        expect(instance.undo()).toEqual('2');
        expect(instance.redo()).toEqual('3');
        instance.clear();
        expect(instance.canUndo()).toBeFalsy();
        expect(instance.canRedo()).toBeFalsy();
        // expect(instance.undo()).to.not.exist;
        // expect(instance.redo()).to.not.exist;
        instance.undo();
        instance.redo()
    });
});