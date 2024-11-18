export function onRequest(context, next) {
    // let reqURL = context.url.pathname;
    // console.log(`Middleware - Request at: ${reqURL}`);

    // default middleware reaction
    // middleware's honest reaction: ...
    return next();
}