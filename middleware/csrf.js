const { csrfSync } = require('csrf-sync');

const { generateToken, csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => {
        if (req.body && req.body._csrf) return req.body._csrf;
        return req.headers['x-csrf-token'];
    }
});

module.exports = { generateToken, csrfSynchronisedProtection };
