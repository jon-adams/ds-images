/**
 * An error from one of the valid serverless providers. Duck-typing at its finest.
 */
export class ProviderError extends Error {
    /**
     * A unique short code representing the error that was emitted.
     */
    public code: string;
}
