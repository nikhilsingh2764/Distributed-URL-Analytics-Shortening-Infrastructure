/** Wraps an async controller so rejected promises reach the error middleware. */
const TryCatch = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

export default TryCatch;
