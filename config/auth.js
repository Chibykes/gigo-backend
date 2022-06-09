module.exports = {
    /**
     * Protecting links to non-logged in users
     */
    ensureAuth: function(req, res, next){
        if(req.user){
            if(req.isAuthenticated()){
                return next();
            }
        }
        res.json({
            status: 'error',
            msg: 'User not logged in'
        })
    }
}