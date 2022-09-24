const app = require('express').Router();
const passport = require('passport');
const Admins = require('../models/Admins');
const Transactions = require('../models/Transactions');
const Business = require('../models/Business');
const Inventory = require('../models/Inventory');
const History = require('../models/History');
const Pins = require('../models/Pins');
const gen_id = require('../utils/genIDs');
const bcrypt = require('bcryptjs');
const { ensureAuth }  = require('../config/auth')

const TransactionsRoute = require('./trx');
const InventoryRoute = require('./inventory');


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


app.use('/trx', TransactionsRoute);
app.use('/inventory', InventoryRoute);



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

app.post('/new-staff', ensureAuth, async(req, res) => {

    const business = req.user.business._id;

    const {
        password
    } = req.body;

    const staff = await Admins.create({
        id: 'GO' + gen_id(['genUppercase','genNumber'], 4),
        business,
        ...req.body,
        role: 'staff',
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
    });

    History.create({
        section: 'staff',
        action: 'create',
        oldData: {},
        newData: staff,
        staff: staff._id,
        business: req.user.business._id,
        initiator: req.user._id
    });

    res.json({
        status: 'success',
        msg: 'Staff Added Successfully',
        user: req.user
    });

})

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

    const { 
        date,
        search,
        type,
        status
    } = req.query;
     
    const business = req.user.business._id;
    const query = { };
    const sort = { };

    if(search){ 
        query.$or = [
            {id: {$regex: search.trim().toUpperCase().replace(/\\/ig, '')}},
            {customer_name: {$regex: search.trim().toLowerCase().replace(/\\/ig, '')}},
            {customer_phone: {$regex: search.trim().toLowerCase().replace(/\\/ig, '')}},
        ]
    }

    if(date){
        const { from, to } = JSON.parse(date);
        query.createdAt = { 
            $gt: new Date(from).getTime(),
            $lt: new Date(to).getTime()
        }

        sort.createdAt = 'desc';
    }

    if(type) query.type = type;

    if(status) {
        if(status == "fully paid") query.balance = 0;
        if(status == "owing") query.balance = { $gt: 0 };
    }


    const sales = await Transactions.find({
        ...query,
        business,
        type: 'sales',
    }, 'customer_name amount').sort({amount: 'desc'});
    
    const debts = await Transactions.find({ 
        ...query,
        balance: { $gt: 0 },
        business,
        type: 'sales',
    }, 'customer_name balance').sort({balance: 'desc'});
    
    const expenses = await Transactions.find({ 
        ...query,
        business,
        type: 'debit',
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

app.get('/fake', async(req, res) => {
    for(let i=0; i<20; i++){
        Transactions.create({
            "id": `GO${gen_id(['genLowercase','genNumber'], 7)}`,
            "type": "sales",
            "customer_name": `${gen_id(['genLowercase'], 7)}`,
            "customer_phone": "08168202349",
            "sales": [
                {
                    "product": "Fake Item",
                    "qty": "33",
                    "unit": "packs",
                    "price": "333",
                    "description": ""
                }
            ],
            "amount": 10039,
            "balance": 50,
            "discount": 900,
            "description": "",
            "reference": "982902460837262",
            "payment_method": "cash",
            "business": "62f256ca659247c831addf14",
            "initiator": "62b8231085ebe4eaeb9a8ceb",
        })
    }

    res.json({status: 200, msg: 'Fake Transactions Added'});
})

module.exports = app;