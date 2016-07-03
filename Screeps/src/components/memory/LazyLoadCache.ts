class LazyLoadCache<T> {
    private memoryAccessor: () => T;

    private cache: T;
    private cacheInvalidationTime: number;

    constructor() {

    }

    public get() {

    }
}