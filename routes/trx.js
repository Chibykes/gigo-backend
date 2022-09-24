const app = require('express').Router();
const Transactions = require('../models/Transactions');
const Inventory = require('../models/Inventory');
const History = require('../models/History');
const gen_id = require('../utils/genIDs');
const { ensureAuth }  = require('../config/auth')

// Transaction Route

app.get('/', ensureAuth, async(req, res)=>{

    const { 
        limit,
        date,
        search,
        type,
        status,
        page,
        list
     } = req.query;

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

    const data = await Transactions.find({
        business: req.user.business._id,
        ...query
    }, list && '_id id -initiator -business type customer_name customer_phone amount balance createdAt')
    .populate('business')
    .populate('initiator')
    .populate('debt_resolver')
    .sort(JSON.stringify(sort) != '{}' ? sort : {createdAt: 'desc'})
    .skip(((page || 1)-1) * (limit||20))
    .limit(limit || 20);

    res.json({
        status: 'success',
        msg: 'Transactions found',
        data,
        user: req.user != null
    });
});

app.post('/', ensureAuth, async(req, res) => {

    try{
        const trx = await Transactions.create({
            business: req.user.business._id,
            ...req.body,
            id: `GO${gen_id(['genLowercase','genNumber'], 7)}`,
            reference: gen_id(['genNumber'], 15),
            initiator: req.user._id
        });

        if(req.body.type === "sales"){
            req.body.sales.forEach(async({product, qty}) => {
                await Inventory.findOneAndUpdate({ name: product }, {$inc: { qty: -parseInt(qty) }})
            });
        }

        History.create({
            section: 'transaction',
            action: 'create',
            oldData: {},
            newData: trx,
            transaction: trx._id,
            business: req.user.business._id,
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

app.delete('/', ensureAuth, async(req, res) => {

    try{
        const business = req.user.business._id;
        const id = req.query.search;
    
        const trx = await Transactions.findOne({id, business}).exec();
        await Transactions.findOneAndDelete({id, business}).exec();

        History.create({
            section: trx.type,
            action: 'delete',
            oldData: trx,
            newData: {},
            transaction: trx._id,
            business: req.user.business._id,
            initiator: req.user._id
        });
    
        res.json({
            status: 'success'
        })
    } catch(e){
        res.json({
            status: 'error'
        })

    }

});

app.put('/', ensureAuth, async(req, res) => {
    
    try{
        const business = req.user.business._id;
        const id = req.query.search;
    
        delete req.body.business;
        delete req.body.initiator;
        const trx = await Transactions.findOneAndUpdate({id, business}, {...req.body}).exec();

        History.create({
            section: trx.type,
            action: 'edit',
            oldData: trx,
            newData: req.body,
            transaction: trx._id,
            business: req.user.business._id,
            initiator: req.user._id
        });
    
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

module.exports = app;