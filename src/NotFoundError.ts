import { ProviderError} from "./ProviderError";

/**
 * The request image file was not found in the specified provider and location
 */
export class NotFoundError extends Error {
    constructor(message: string, public innerException: ProviderError) {
        super(message);
    }
}
