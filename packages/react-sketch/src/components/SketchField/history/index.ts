/**
 * Maintains the history of an object: the undo and redo stacks, limited to
 * the given number of steps
 */
export class UndoHistory<T = unknown> {
  private readonly undoLimit: number;
  private undoList: T[] = [];
  private redoList: T[] = [];
  private current: T | null = null;

  constructor(undoLimit = 10) {
    this.undoLimit = undoLimit;
  }

  /**
   * Get the limit of undo/redo actions
   *
   * @returns the undo limit, as it is configured when constructing the history instance
   */
  getUndoLimit(): number {
    return this.undoLimit;
  }

  /**
   * Get Current state
   *
   * @returns the last kept object, or null when the history is empty
   */
  getCurrent(): T | null {
    return this.current;
  }

  /**
   * Keep an object to history
   *
   * This method will set the object as current value and will push the previous "current" object to the undo history
   *
   * @param obj the object to keep
   */
  keep(obj: T): void {
    this.redoList = [];
    if (this.current !== null) {
      this.undoList.push(this.current);
    }
    if (this.undoList.length > this.undoLimit) {
      this.undoList.shift();
    }
    this.current = obj;
  }

  /**
   * Forget the last object kept, as if it was never kept
   *
   * @returns the object forgotten, or null when the history is empty
   */
  pop(): T | null {
    const last = this.current;
    this.current = this.undoList.pop() ?? null;
    return last;
  }

  /**
   * Undo the last object, this operation will set the current object to one step back in time
   *
   * @returns the new current value after the undo operation, else null if no undo operation was possible
   */
  undo(): T | null {
    if (this.current !== null) {
      this.redoList.push(this.current);
      if (this.redoList.length > this.undoLimit) {
        this.redoList.shift();
      }
      if (this.undoList.length === 0) this.current = null;
    }
    if (this.undoList.length > 0) {
      this.current = this.undoList.pop() as T;
      return this.current;
    }
    return null;
  }

  /**
   * Redo the last object, redo happens only if no keep operations have been performed
   *
   * @returns the new current value after the redo operation, or null if no redo operation was possible
   */
  redo(): T | null {
    if (this.redoList.length > 0) {
      if (this.current !== null) this.undoList.push(this.current);
      this.current = this.redoList.pop() as T;
      return this.current;
    }
    return null;
  }

  /**
   * Checks whether we can perform a redo operation
   */
  canRedo(): boolean {
    return this.redoList.length > 0;
  }

  /**
   * Checks whether we can perform an undo operation
   */
  canUndo(): boolean {
    return this.undoList.length > 0 || this.current !== null;
  }

  /**
   * Clears the history maintained, can be undone
   */
  clear(): void {
    this.undoList = [];
    this.redoList = [];
    this.current = null;
  }
}
