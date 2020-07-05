// *************
// 
// Imports
// 
import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

// express app 
const app = express();

// Tell server where to serve static files from
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// boilerplate for connecting to db and carrying out operation
const withDB = async (operations, res) => {
    try {
        // connect to local mongodb
        // get client
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true});
        // select db
        const db = client.db('mern-blog');

        // call operations
        await operations(db);

        // close connection
        client.close();

    } catch (error){
        res.status(500).json({ message: `Error connecting to db `, error});
    }
}



// *************
// 
// Endpoints
// 

// GET Requests
// 
// Get articles from DB
// This uses the withDB boilerplate to not repeat DB connection code with every endpoint
app.get('/api/articles/:name', async (req, res) => {
    // Call withDB function to connect to DB
    withDB(async(db) => {
        // Get article name from params
        const articleName = req.params.name;

        // query the database to get correct article
        const articleInfo = await db.collection('articles').findOne({ name: articleName })

        // respond with article info
        res.status(200).json(articleInfo);
    }, res)
})


// Post Requests
// 
// Adding upvotes to articles
// This doesn't use the withDB boilerplate to serve as an example 
app.post('/api/articles/:name/upvote', async (req, res) => {
    try{
        // Get article name from params
        const articleName = req.params.name;

        // connect to local mongodb
        // get client
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true});
        const db = client.db('mern-blog');

        // query the DB for the correct article
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        // update upvotes
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes +1,
            },
        })

        // Get updated article from DB
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        // Respond with status OK and updated article
        res.status(200).json(updatedArticleInfo);

        // close connection
        client.close();

    } catch (error){
        res.status(500).json({ message: `Error connecting to db `, error})
    }    
})


// Adding comments
app.post('/api/articles/:name/add-comment', (req, res) => {
    // Pull username and text from body
    const { username, text } = req.body;

    // Get article name from params
    const articleName = req.params.name;

    // connect to db
    withDB(async (db) => {
        // get correct article
        const articleInfo = await db.collection('articles').findOne({ name: articleName});
        // add comment to article info
        await db.collection('articles').updateOne({ name: articleName}, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text}),
            },
        });
        // get the updated article
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName});
        
        // respond with updated article
        res.status(200).json(updatedArticleInfo);
    }, res)
});


// all requests that arent caught by other api routes
// should be passed onto our app
// will allow app to navigate through pages and process urls correctly
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});



// **************
// 
// Start APP
// 
app.listen(8000, () => console.log('Listening on port 8000'));