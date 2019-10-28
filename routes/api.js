/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

let dbConnection;

function getDBConnection() {
  if (!dbConnection) {
    dbConnection = MongoClient.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  }
  return dbConnection;
}


module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .post((req, res) => {
    let { board } = req.params;
    let { text, delete_password } = req.body;
    let created_on = new Date();
    let bumped_on = created_on;
    let reported = false;
    let replies = [];
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).insertOne({
        text,
        delete_password,
        created_on,
        bumped_on,
        reported,
        replies
      })
      .then(() => res.redirect(`/b/${board}/`))
      .catch(err => Promise.reject(err));
    });
  })
  .get((req, res) => {
    let { board } = req.params;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      let option = { sort: { bumped_on: -1 }, limit: 10 };
      db.collection(board).find({}, option).toArray()
      .then(result => {
        result = result.map(e => {
          e.replycount = e.replies.length;
          e.replies = e.replies.slice(e.replies.length-3>0 ? e.replies.length-3 : 0).reverse();
          e.replies.forEach(ele => {
            delete ele.reported;
            delete ele.delete_password;
          })
          delete e.reported;
          delete e.delete_password;
          return e;
        });
        res.send(result);
      })
      .catch(err => Promise.reject(err));
    });
  })
  .delete((req, res) => {
    let { board } = req.params;
    let { thread_id, delete_password } = req.body;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).findOneAndDelete({ _id: ObjectId(thread_id), delete_password })
      .then(result => res.send(result.value ? 'success' : 'incorrect password'))
      .catch(err => Promise.reject(err));
    });
  })
  .put((req, res) => {
    let { board } = req.params;
    let { thread_id } = req.body;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).findOneAndUpdate(
      { _id: ObjectId(thread_id) },
      { $set: { reported: true } }
      )
      .then(result => res.send(result.value ? 'success' : 'some error occured'))
      .catch(err => Promise.reject(err));
    });
  });
    
  app.route('/api/replies/:board')
  .post((req, res) => {
    let { board } = req.params;
    let { text, delete_password, thread_id } = req.body;
    let created_on = new Date();
    let bumped_on = new Date();
    let reported = false;
    let _id = ObjectId();
    
    let replyObj = { _id, text, delete_password, created_on, reported }
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).findOneAndUpdate(
      { _id: ObjectId(thread_id) }, 
      { $set: { bumped_on }, $push: { replies: replyObj } }
      )
      .then(() => res.redirect(`/b/${board}/${thread_id}/`))
      .catch(err => Promise.reject(err));
    });
  })
  .get((req, res) => {
    let { board } = req.params;
    let { thread_id } = req.query;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).find({ _id: ObjectId(thread_id) })
      .toArray()
      .then(result => {
        if (result.length) {
          let { replies } = result[0];
          delete result[0].delete_password;
          delete result[0].reported;
          result[0].replies = replies.map(e => {
            delete e.delete_password;
            delete e.reported;
            return e;
          });
          res.send(result[0]);
        } else {
          res.send('No match found');
        }
      });
    });
  })
  .delete((req, res) => {
    let { board } = req.params;
    let { thread_id, reply_id, delete_password } = req.body;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).find({ _id: ObjectId(thread_id) })
      .toArray()
      .then(result => {
        if (result.length) {
          let { replies } = result[0];
          let isChanged = false;
          replies.forEach((e, i) => {
            if (e._id.toString() === reply_id && e.delete_password === delete_password) {
              result[0].replies[i].text = '[deleted]';
              isChanged = true;
            }
          })
          if (isChanged) {
            db.collection(board).findOneAndUpdate(
            { _id: ObjectId(thread_id) },
            { $set: { replies: result[0].replies } }
            )
            .then(result => res.send(result.value ? 'success' : 'Unexpected error occured'))
            .catch(err => Promise.reject(err));
          } else {
            res.send('incorrect password');
          }
        } else {
          res.send('No match found');
        }
      })
      .catch(err => Promise.reject(err));
    });
  })
  .put((req, res) => {
    let { board } = req.params;
    let { thread_id, reply_id } = req.body;
    
    getDBConnection().then(client => {
      let db = client.db('test');
      db.collection(board).find({ _id: ObjectId(thread_id) })
      .toArray()
      .then(result => {
        if (result.length) {
          let { replies } = result[0];
          let isMatch = false;
          replies.forEach((e, i) => {
            if (e._id.toString() === reply_id) {
              result[0].replies[i].reported = true;
              isMatch = true;
            }
          })
          if (isMatch) {
            db.collection(board).findOneAndUpdate(
            { _id: ObjectId(thread_id) },
            { $set: { replies: result[0].replies } }
            )
            .then(result => res.send(result.value ? 'success' : 'Unexpected error occured'))
            .catch(err => Promise.reject(err));
          } else {
            res.send('No match found');
          }
        } else {
          res.send('No match found');
        }
      })
      .catch(err => Promise.reject(err));
    });
  });

};
