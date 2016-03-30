/**
 * Maintains the history of an object
 */
class History {
    constructor(undoLimit = 10) {
        this.undoLimit = undoLimit;
        this.undoList = [];
        this.redoList = [];
    }

    /**
     * Get the limit of undo/redo actions
     *
     * @returns {number|*} the undo limit, as it is configured when constructing the history instance
     */
    getUndoLimit() {
        return this.undoLimit;
    }

    last() {
        let last = this.undoList.length - 1;
        return this.undoList[last];
    }

    /**
     * Keep an object to history
     * @param obj
     */
    keep(obj) {
        this.undoList.push(obj);
        this.redoList = [];
        if (this.undoList.length > this.undoLimit) {
            this.undoList.shift();
        }
    }

    /**
     * Undo the last object
     *
     * @returns {Object} the object before the last keep
     */
    undo() {
        if (this.undoList.length > 0) {
            // keep the latest to the redoList
            let last = this.undoList.pop();
            this.redoList.push(last);
            if (this.redoList.length > this.undoLimit) {
                this.redoList.shift();
            }
            return last
        }
        return null;
    }


    /**
     * Redo the last object, redo happens only if no keep operations have been performed
     *
     * @returns {null}
     */
    redo() {
        if (this.redoList.length > 0) {
            let last = this.redoList.pop();
            this.undoList.push(last);
            return last;
        }
        return null;
    }

    /**
     * Checks whether we can perform a redo operation
     *
     * @returns {boolean}
     */
    canRedo() {
        return this.redoList.length > 0;
    }

    /**
     * Checks whether we can perform an undo operation
     *
     * @returns {boolean}
     */
    canUndo() {
        return this.undoList.length > 0;
    }

    /**
     * Clears the history maintained, can be undone
     */
    clear() {
        this.undoList = [];
        this.redoList = [];
    }
}

export default History;