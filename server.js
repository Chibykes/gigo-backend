const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const dotenv =  require('dotenv');
const cors = require('cors');
const passport = require('passport');
const port = process.env.PORT || 8080;
const connectDB = require('./config/db-connection');

dotenv.config({ path: './config/config.env' });

//Connecting to the Database
connectDB();

app.set('trust proxy', true);
app.use(cors({
    origin: "https://victory-granite.vercel.app/",
    methods: ["GET","HEAD","PUT","PATCH","POST","DELETE"],
    credentials: true,
    exposedHeaders: ['Set-Cookie', 'Date', 'ETag']
}));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
  secret: "keyword",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: 2592000000
  },
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI,
    mongooseConn: mongoose.connection 
  })
}));

// =============PASSPORT============ //
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// =========== FLASH MESSAGES =========== //
app.use(flash());

app.get('/', (req, res) => res.json({
  status: 'success',
  message: 'Welcome to the API'
}));

app.use('/api', require('./routes/api'));


app.listen(port, ()=>{ console.log(`Server running on port: ${port}`) });