const app = require('express').Router();
const passport = require('passport');
const Admins = require('../models/Admins');
const Transactions = require('../models/Transactions');
const Business = require('../models/Business');
const Pins = require('../models/Pins');
const gen_id = require('../utils/genIDs');
const bcrypt = require('bcryptjs');
const { ensureAuth }  = require('../config/auth')


app.get('/auth', (req,res) => { 
    res.json({
        status: 'success',
        msg: 'Login Page',
        data: null
    }) 
})

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

app.post('/new-sales', ensureAuth, async(req, res) => {

    try{
        const trx = await Transactions.create({
            business: req.user.business._id,
            ...req.body,
            id: `GO${gen_id(['genLowercase','genNumber'], 7)}`,
            type: 'sales',
            reference: gen_id(['genNumber'], 15),
            initiator: req.user._id
        });

        res.json({
            status: 'success',
            msg: 'Transaction has been added',
            data: {id: trx.id},
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
            business: req.user.business._id,
            ...req.body,
            id: `GO${gen_id(['genLowercase','genNumber'], 7)}`,
            type: 'debit',
            reference: gen_id(['genNumber'], 15),
            initiator: req.user._id
        });

        res.json({
            status: 'success',
            msg: 'Transaction has been added',
            data: {id: trx.id},
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

    console.log(req.user);

    const data = await Transactions.find({
        business: req.user.business._id,
        ...query,
    })
    .populate('business')
    .populate('initiator')
    .populate('debt_resolver')
    .sort({updatedAt: 'desc'})
    .limit(limit);

    const specificTrx = await Transactions.find({ 
        business: req.user.business._id,
        createdAt:  { 
            $gt: new Date(new Date(new Date().toLocaleDateString()).getTime() - (1000 * 60 * 60 * 24 * date )).getTime() 
        }
    });


    res.json({
        status: 'success',
        msg: 'Transactions found',
        data,
        specificTrx,
        user: req.user
    });
});

app.get('/staffs', ensureAuth, async(req, res)=>{

    const business = req.user.business._id;
    const { action, id } = JSON.parse(req.query?.query);

    if(action === 'delete'){
        Admins.findOneAndDelete({business, id, role: 'staff'}).exec();

        res.json({
            status: 'success',
            msg: 'Staff Deleted',
            user: req.user
        });
        return;
    }

    const query = req.query.query && JSON.parse(req.query.query);

    const data = await Admins.find({...query, business, role: 'staff'}, '-img').sort({updatedAt: 'desc'});

    res.json({
        status: 'success',
        msg: 'Staffs found',
        data,
        user: req.user
    });
});

app.post('/new-staff', ensureAuth, (req, res) => {

    const business = req.user.business._id;

    const {
        password
    } = req.body;

    Admins.create({
        id: 'GO' + gen_id(['genUppercase','genNumber'], 4),
        business,
        ...req.body,
        role: 'staff',
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
    });

    res.json({
        status: 'success',
        msg: 'Staff Added Successfully',
        user: req.user
    });

})

app.get('/delete-trx', ensureAuth, async(req, res) => {

    try{
        const business = req.user.business._id;
        const query = JSON.parse(req.query.query);
    
        await Transactions.findOneAndDelete({...query, business}).exec();
    
        res.json({
            status: 'success'
        })
    } catch(e){
        res.json({
            status: 'error'
        })

    }

});

app.post('/edit-transaction', ensureAuth, async(req, res) => {
    
    try{
        const business = req.user.business._id;
        const query = JSON.parse(req.query.query);
    
        await Transactions.findOneAndUpdate({...query, business}, {...req.body}).exec();
    
        res.json({
            status: 'success',
            user: req.user
        })
    } catch(e){
        res.json({
            status: 'error',
            user: req.user
        })

    }

});

app.post('/resolve-debt', ensureAuth, async(req, res)=>{
    try {
        const business = req.user.business._id;
        const { id, amount, balance } = req.body;
        
        await Transactions.findOneAndUpdate(
            {id, business},
            { amount, balance, debt_resolver: req.user._id }
        );
    
        res.json({
            status: 'success',
            msg: '',
            user: req.user
        });

    } catch (e){
        res.json({
            status: 'error',
            msg: 'Could not resolve debt',
            user: req.user
        });

    }
});

app.post('/profile', ensureAuth, async(req, res) => {

    const business = req.user.business._id;
    const { _id, password } = req.body;
    let profile;

    if(password){
        profile = await Admins.findOneAndUpdate({_id, business}, {
            ...req.body,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        }, {new: true});
    } else {
        delete req.body.password;
        profile = await Admins.findOneAndUpdate({_id, business}, {
            ...req.body,
        }, {new: true});
    }

    res.json({
        status: 'success',
        msg: 'Info Updated',
        user: profile
    });

});

app.get('/reports', ensureAuth, async(req, res)=>{

    const date = (parseInt(req.query.date)-1) || 0;
    const business = req.user.business._id;
    const time = new Date(new Date(new Date().toLocaleDateString()).getTime() - (1000 * 60 * 60 * 24 * date )).getTime() ;

    const sales = await Transactions.find({
        business,
        type: 'sales',
        createdAt:  { $gt: time }
    }, 'customer_name amount').sort({amount: 'desc'});
    
    const debts = await Transactions.find({ 
        business,
        type: 'sales',
        createdAt:  { $gt: time }
    }, 'customer_name balance').sort({balance: 'desc'});
    
    const expenses = await Transactions.find({ 
        business,
        type: 'debit',
        createdAt:  { $gt: time }
    }, 'amount').sort({createdAt: 'desc'});


    res.json({
        status: 'success',
        msg: 'Transactions found',
        data: {
            sales,
            debts,
            expenses
        },
        user: req.user
    });

});

app.post('/subscribe', ensureAuth, async(req, res) => {
    
    const _id = req.user.business._id;
    const {pin} = req.body;
    const pinDetails = await Pins.findOneAndDelete({ pin }).exec();

    if(pinDetails){
        await Business.findOneAndUpdate({ _id }, {
            expiryDate: new Date(new Date().getTime() + (pinDetails.days * 1000 * 60 * 60 * 24))
        }, {new: true}).exec();

        return res.json({
            status: "success",
            msg: "Sucessfully Subscribed"
        });
    }
    
    return res.json({
        status: "error",
        msg: "PIN does not exist",
    });

});

app.get('/exit', ensureAuth, async(req, res)=>{
    req.logOut();
    res.json({
        status: 'success',
        msg: 'Logout Successful',
        data: null
    })
});

module.exports = app;