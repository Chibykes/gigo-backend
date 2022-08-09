const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Admins = require('../models/Admins');

module.exports = (passport) => {
    /**
     * This passport authentication is for User
     */
    passport.use(
        new LocalStrategy(
            { usernameField: 'username', passwordField:'password' }, 
            (username, password, done) => {
                
                Admins.findOne({ $or: [{username}, {id: username.toUpperCase()}] })
                .populate('business')
                .then(admin => {
                    if(!admin){
                        return done(null, 'Username Incorrect');
                    }

                    bcrypt.compare(password, admin.password)
                        .then(async(isMatch) => {
                            if(isMatch){
                                return done(null, admin)
                            }
                            
                            return done(null, 'Password Incorrect');
                        })
                        .catch(err => console.error(err));
                })
                .catch(err => console.error(err));

        })
    );


    passport.serializeUser((admin, done)=>{
        return done(null, admin._id);
    });

    passport.deserializeUser((id, done)=>{
        Admins.findById({ _id: id })
        .populate('business')
        .exec((err, admin) => {
            return done(err, admin);
        })
    });
}