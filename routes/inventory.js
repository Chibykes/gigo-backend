const app = require('express').Router();
const Inventory = require('../models/Inventory');
const History = require('../models/History');
const gen_id = require('../utils/genIDs');
const { ensureAuth }  = require('../config/auth')


// Inventory Route

app.get('/', ensureAuth, async(req, res) => {

    const { 
        search,
        limit,
        list,
        page
     } = req.query;

    const query = { };

    if(search){
        query.$or = [
            {id: {$regex: search.trim().toUpperCase().replace(/\\/ig, '')}},
            {name: {$regex: search.trim().toLowerCase().replace(/\\/ig, '')}},
        ]
    }

    const product = await Inventory.find({ 
        business: req.user.business._id,
        ...query
    }, list && '-business -initiator')
    .sort({ createdAt: 'desc' })
    .skip(((page || 1)-1) * (limit||20))
    .limit(limit || 20);


    res.json({
        status: 'success',
        msg: '',
        data: product,
        user: req.user !== null
    })

});

app.post('/', ensureAuth, async(req,res) => {
    const product = req.body;

    const productExist = await Inventory.findOne({ business: req.user.business._id, name: product.name });

    if(productExist){
        return res.json({
            status: 'error',
            msg: 'Produt Aleardy Exists'
        });
    }

    const newProduct = await Inventory.create({
        id: `PROD${gen_id(['genLowercase','genNumber'], 7)}`,
        ...product,
        business: req.user.business._id,
        user: req.user
    });

    History.create({
        section: 'inventory',
        action: 'create',
        oldData: {},
        newData: newProduct,
        product: newProduct._id,
        business: req.user.business._id,
        initiator: req.user._id
    });
    
    res.json({
        status: 'success',
        msg: '',
        user: req.user,
        data: { id: newProduct.id }
    })
});

app.delete('/', ensureAuth, async(req,res) => {

    const { search: id } = req.query;

    const product = await Inventory.findOne({ business: req.user.business._id, id });
    await Inventory.findOneAndDelete({ business: req.user.business._id, id });
    
    History.create({
        section: 'inventory',
        action: 'delete',
        oldData: product,
        newData: {},
        product: product._id,
        business: req.user.business._id,
        initiator: req.user._id
    });
    
    res.json({
        status: 'success',
        msg: '',
        user: req.user
    })
});

app.put('/', ensureAuth, async(req, res) => {

    const { search: id } = req.query;
    const { name, qty, unit, cost_price, selling_price, action } = req.body;

    const oldData = await Inventory.findOne({ 
        business: req.user.business._id,
        id
    });

    History.create({
        section: 'inventory',
        action,
        oldData,
        newData: { name, qty, unit, cost_price, selling_price, action },
        product: oldData._id,
        business: req.user.business._id,
        initiator: req.user._id
    });

    const product = await Inventory.findOneAndUpdate({ 
        business: req.user.business._id,
        id
    }, { name, qty, unit, cost_price, selling_price }, {new: 1} );

    res.json({
        status: 'success',
        msg: '',
        data: product,
        user: req.user !== null
    })

});

app.get('/all', ensureAuth, async(req, res) => {

    const { 
        search
     } = req.query;

    const query = { };
    const product = await Inventory.find({ 
        business: req.user.business._id,
        ...query
    }, list && '-business -initiator')
    .sort({ createdAt: 'desc' });

    res.json({
        status: 'success',
        msg: '',
        data: product,
        user: req.user !== null
    })

});

app.get('/report', ensureAuth, async(req, res) => {

    const all_products = await Inventory.find({ 
        business: req.user.business._id
    }, '-business -initiator').sort({createdAt: 'desc'});
    
    res.json({
        status: 'success',
        msg: '',
        user: req.user != null,
        data: {
            purchase: all_products.reduce((t, c) => t += c.cost_price * c.qty, 0),
            selling: all_products.reduce((t, c) => t += c.selling_price * c.qty, 0),
            length: all_products.length
        }
    })

});

module.exports = app;
