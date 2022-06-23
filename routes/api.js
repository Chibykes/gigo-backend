const app = require('express').Router();
const passport = require('passport');
const Transactions = require('../models/Transactions');
const gen_id = require('../utils/genIDs');
const bcrypt = require('bcryptjs');
const Admins = require('../models/Admins');
const { ensureAuth }  = require('../config/auth')


// app.get('/auth', (req,res) => { 
//     res.json({
//         status: 'success',
//         msg: 'Login Page',
//         data: null
//     }) 
// })

app.post('/auth', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if(err) return res.json({status: 'error', msg: 'Error Authenticating'});
        if(typeof(user) === 'string') return res.json({status: 'error', msg: user});

        req.login(user, err => {
            if(err) return res.json({status: 'error', msg: 'Error Authenticating'});
            
            res.json({ 
                status: 'success',
                msg: 'User successfully authenticated',
                user,
            });
        });
    })(req, res, next);

});

app.post('/new-staff', ensureAuth, (req, res) => {

    const {
        password
    } = req.body;

    Admins.create({
        id: 'VG' + gen_id(['genUppercase','genNumber'], 4),
        ...req.body,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
    });

    res.json({
        status: 'success',
        msg: 'Staff Added Successfully',
        user: req.user
    });

})

app.post('/new-sales', ensureAuth, async(req, res) => {

    try{
        const trx = await Transactions.create({
            ...req.body,
            id: `VG${gen_id(['genLowercase','genNumber'], 7)}`,
            type: 'sales',
            reference: gen_id(['genNumber'], 15),
            creator: req.user._id
        });

        res.json({
            status: 'success',
            msg: 'Transaction has been added',
            data: trx,
            user: req.user
        });
        
    } catch(e) {
        res.json({
            status: 'error',
            msg: 'An error occured',
            data: null,
            user: req.user
        })
    }

});

app.post('/new-spendings', ensureAuth, async(req, res) => {

    try{
        const trx = await Transactions.create({
            ...req.body,
            id: gen_id(['genLowercase','genNumber'], 7),
            type: 'debit',
            reference: gen_id(['genNumber'], 15)
        });

        res.json({
            status: 'success',
            msg: 'Transaction has been added',
            data: trx,
            user: req.user
        });
        
    } catch(e) {
        res.json({
            status: 'error',
            msg: 'An error occured',
            data: null,
            user: req.user
        })
    }

});

app.get('/trx', ensureAuth, async(req, res)=>{

    const limit = parseInt(req.query.limit) || 10;
    const date = parseInt(req.query.date) || 0;
    const query = req.query.query && JSON.parse(req.query.query);

    const data = await Transactions.find(query).sort({updatedAt: 'desc'}).limit(limit);

    const specificTrx = await Transactions.find({ createdAt:  { 
        $gt: new Date(new Date(new Date().toLocaleDateString()).getTime() - (1000 * 60 * 60 * 24 * date )).getTime() 
    }});


    res.json({
        status: 'success',
        msg: 'Transactions found',
        data,
        specificTrx,
        user: req.user
    });
});

app.get('/delete-trx'. ensureAuth, async(req, res) => {

    try{
        const {id} = req.query;
    
        await Transactions.findOneAndDelete({ id }).exec();
    
        res.json({
            status: 'success'
        })
    } catch(e){
        res.json({
            status: 'error'
        })

    }

});

app.post('/resolve-debt', ensureAuth, async(req, res)=>{
    try {
        const { id, amount, balance } = req.body;
        const data = await Transactions.findOneAndUpdate(
            {id},
            { amount, balance }
        )
    
    
        res.json({
            status: 'success',
            msg: '',
            user: req.user
        });
    } catch (e){
        console.log(e);
        res.json({
            status: 'error',
            msg: 'Could not resolve debt',
            user: req.user
        });

    }
});

app.get('/exit', ensureAuth, async(req, res)=>{
    req.logOut();
    res.json({
        status: 'success',
        msg: 'Logout Successful',
        data: null
    })
});

// app.get('/user', ensureAuth, async(req, res) => {
//     res.json({
//         status: 'success',
//         user: req.user,
//     });
// });

module.exports = app;