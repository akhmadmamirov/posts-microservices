const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')


const app =  express();
app.use(bodyParser.json())
app.use(cors())

const posts = {}

//Ship the data
app.get('/posts', (req, res) => {
    res.status(200).json(posts)
})

//Receiving from event-bus & preparing data to ship
app.post('/events', (req, res) => {
    const {type, data} = req.body;

    handleEvent(type, data)


    res.status(200).json({});
})

//event Handling
const handleEvent = (type, data) => {
    if (type === 'PostCreated') {
        const {id, title} = data;

        posts[id] = {id, title, comments: []}
    }

    if (type === 'CommentCreated') {
        const {id, content, postId, status} = data;

        posts[postId].comments.push({id, content, status: "pending"})
    }

    if (type === "CommentUpdated") {
        const {id, status, postId, content} = data

        const comments = posts[postId].comments

        const comment = comments.find(comment => {
            return comment.id === id
        })

        comment.status = status;
        comment.content = content;
    }

}

app.listen(4002, async () => {
    console.log('Listening on port 4002');

    const res = await axios.get('http://event-bus-srv:4005/events');
    
    //Evnent syncing
    for (let event of res.data) {
        console.log('Processing event: ', event.type)
        handleEvent(event.type, event.data)
    }

})

