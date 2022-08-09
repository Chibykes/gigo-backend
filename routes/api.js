const app = require('express').Router();
const passport = require('passport');
const Admins = require('../models/Admins');
const Transactions = require('../models/Transactions');
const Settings = require('../models/Settings');
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
            ...req.body,
            id: `GO${gen_id(['genLowercase','genNumber'], 7)}`,
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
            id: `GO${gen_id(['genLowercase','genNumber'], 7)}`,
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

app.get('/staffs', ensureAuth, async(req, res)=>{

    const { action, id } = JSON.parse(req?.query?.query);

    if(action === 'delete'){
        Admins.findOneAndDelete({id, role: 'staff'}).exec();

        res.json({
            status: 'success',
            msg: 'Staff Deleted',
            user: req.user
        });
        return;
    }

    const query = req.query.query && JSON.parse(req.query.query);

    const data = await Admins.find({...query, role: 'staff'}, '-img').sort({updatedAt: 'desc'});

    res.json({
        status: 'success',
        msg: 'Staffs found',
        data,
        user: req.user
    });
});

app.post('/new-staff', ensureAuth, (req, res) => {

    const {
        password
    } = req.body;

    Admins.create({
        id: 'GO' + gen_id(['genUppercase','genNumber'], 4),
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
        const query = JSON.parse(req.query.query);
    
        await Transactions.findOneAndDelete(query).exec();
    
        res.json({
            status: 'success'
        })
    } catch(e){
        res.json({
            status: 'error'
        })

    }

});

app.post('/edit-transaction/:id', ensureAuth, async(req, res) => {
    
    try{
        const {id} = req.params;
    
        await Transactions.findOneAndUpdate({id}, {...req.body}).exec();
    
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

app.post('/profile', ensureAuth, async(req, res) => {

    const {
        _id,
        password
    } = req.body;

    let profile;

    if(password){
        profile = await Admins.findOneAndUpdate({_id}, {
            ...req.body,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        }, {new: true});
    } else {
        delete req.body.password;
        profile = await Admins.findOneAndUpdate({_id}, {
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
    const time = new Date(new Date(new Date().toLocaleDateString()).getTime() - (1000 * 60 * 60 * 24 * date )).getTime() ;

    const sales = await Transactions.find({
        type: 'sales',
        createdAt:  { $gt: time }
    }, 'customer_name amount').sort({amount: 'desc'});
    
    const debts = await Transactions.find({ 
        type: 'sales',
        createdAt:  { $gt: time }
    }, 'customer_name balance').sort({balance: 'desc'});
    
    const expenses = await Transactions.find({ 
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

app.get('/business', async(req, res) => {
    const businessDetails = await Settings.find({});

    return res.json({
        status: "success",
        business: businessDetails[0]
    });
});

app.post('/subscribe', ensureAuth, async(req, res) => {
    const {_id, pin} = req.body;
    const pinDetails = await Pins.find({ pin }).exec();

    console.log(pinDetails);

    if(pinDetails){
        const business = await Settings.findOneAndUpdate({ _id }, {
            expiryDate: new Date(new Date().getTime() + (pinDetails.days * 1000 * 60 * 60 * 24)).toISOString()
        }, {new: true}).exec();

        return res.json({
            status: "success",
            msg: "Sucessfully Subscribed",
            business,
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

// app.get('/user', ensureAuth, async(req, res) => {
//     res.json({
//         status: 'success',
//         user: req.user,
//     });
// });

module.exports = app;