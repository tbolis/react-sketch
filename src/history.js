/**
 * Maintains the history of an object
 */
class History {
    constructor(undoLimit = 10) {
        this.undoLimit = undoLimit;
        this.undoList = [];
        this.redoList = [];
        this.current = null;
    }

    /**
     * Get the limit of undo/redo actions
     *
     * @returns {number|*} the undo limit, as it is configured when constructing the history instance
     */
    getUndoLimit() {
        return this.undoLimit;
    }

    /**
     * Get Current state
     *
     * @returns {null|*}
     */
    getCurrent() {
        return this.current;
    }

    /**
     * Keep an object to history
     *
     * This method will set the object as current value and will push the previous "current" object to the undo history
     *
     * @param obj
     */
    keep(obj) {
        this.redoList = [];
        if (this.current) {
            this.undoList.push(this.current);
        }
        if (this.undoList.length > this.undoLimit) {
            this.undoList.shift();
        }
        this.current = obj;
    }

    /**
     * Undo the last object, this operation will set the current object to one step back in time
     *
     * @returns the new current value after the undo operation, else null if no undo operation was possible
     */
    undo() {
        if (this.current) {
            this.redoList.push(this.current);
            if (this.redoList.length > this.undoLimit) {
                this.redoList.shift();
            }
        }
        if (this.undoList.length > 0) {
            this.current = this.undoList.pop();
            return this.current;
        }
        return null;
    }

    /**
     * Redo the last object, redo happens only if no keep operations have been performed
     *
     * @returns the new current value after the redo operation, or null if no redo operation was possible
     */
    redo() {
        if (this.redoList.length > 0) {
            this.undoList.push(this.current);
            this.current = this.redoList.pop();
            return this.current;
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
        this.current = null;
    }
}

export default History;