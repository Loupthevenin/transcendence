export class LoadingHandler {
  private loadingStates: boolean[];

  public constructor() {
    this.loadingStates = [];
  }

  /**
   * Add a new loading state and return its index.
   * @returns index of the new created state.
   */
  public addLoadingState(): number {
    const index: number = this.loadingStates.push(false); // Add 'false' (not loaded)
    return index - 1; // Return the index of the new state
  }

  /**
   * Set the state to 'true' (loaded) for a specific index.
   * @param index The index given by 'addLoadingState'.
   */
  public setLoaded(index: number): void {
    if (index >= 0 && index < this.loadingStates.length) {
      this.loadingStates[index] = true;
    }
  }

  /**
   * Get the proportion of loaded items.
   * @returns a value between 0 and 1.
   */
  public getLoadedProportion(): number {
    if (this.loadingStates.length === 0) {
      return 0;
    }
    const loadedCount: number = this.loadingStates.filter((state: boolean) => state === true).length;
    return loadedCount / this.loadingStates.length;
  }

  /**
   * Check if all items are loaded.
   * @returns True if everything is loaded, else false.
   */
  public isAllLoaded(): boolean {
    return this.loadingStates.every((state: boolean) => state === true);
  }

  /**
   * Clear all loading states.
   */
  public clear(): void {
    this.loadingStates.length = 0;
  }
}
