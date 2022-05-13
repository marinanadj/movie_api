// same key used in JWTStrategy definition
const jwtSecret = 'your_jwt_secret';

// imported modules
const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // username were encoding in jwt
        expiresIn: '8h', // token will expire in 8 hours
        algorithm: 'HS256' // algorithm used to "sign" or encode values of the JWT
    });
}

// endpoint for letting users log in
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({ info });
            }
            req.login(user, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}