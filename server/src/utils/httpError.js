// new Error with an HTTP status the global error handler will honour (< 500 => message shown to client).
module.exports = (status, message) => Object.assign(new Error(message), { status });
