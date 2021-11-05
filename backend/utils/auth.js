const jwt = require('jsonwebtoken');
const {jwtConfig} = require('../config');
const {User} = require('../db/models');

const {secret, expiresIn} = jwtConfig;


// setTokenCookie sets the jwt cookie after a user has logged in or signed up

const setTokenCookie = (res, user) => {

    // create cookie
    const token = jwt.sign(
        {data: user.toSafeObject()},
        secret,
        {expiresIn: parseInt(expiresIn)},
    );

    const isProduction = process.env.NODE_ENV === 'production';

    // set cookie
    res.cookie('token', token, {
        maxAge: expiresIn * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction && 'Lax',
    });

    return token;
};

const restoreUser = (req, res, next) => {
    const {token} = req.cookies;

    return jwt.verify(token, secret, null, async(err, jwtPayload) => {
        if (err) {
            return next();
        }

        try {
            const {id} = jwtPayload.data;
            req.user = await User.scope('currentUser').findByPk(id);
        } catch (e) {
            res.clearCookie('token');
            return next();
        }

        if (!req.user) {
            res.clearCookie('token');
        }

        return next();
    });
};

// requireAuth below will check to see if a user has been authenticated in order to allow access to privileged pages
