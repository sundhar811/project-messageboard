/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const ObjectId = require('mongodb').ObjectId;

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let del_thread_id, reply_id, reply_thread_id, report_thread_id;
  
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      for (let i = 0; i < 11; i++) {
        test('Test POST /api/threads/:board/', function(done) {
          chai.request(server)
            .post('/api/threads/test/')
            .send({ delete_password: `password${i}`, text: `text${i}` })
            .end((err, res) => {
              assert.equal(res.status, 200);
              done();
            });
        });
      }
    });
    
    suite('GET', function() {
      test('Test GET /api/threads/:board', function(done) {
        chai.request(server)
          .get('/api/threads/test/')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body.length, 10);
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], '_id');
            assert.isArray(res.body[0].replies);
            assert.equal(res.body[0].replies.length, 0);
            assert.equal(res.body[0].replycount, 0);
            assert.equal(res.body[0].text, 'text10');
            assert.equal(res.body[9].text, 'text1');
            del_thread_id = res.body[0]._id;
            reply_thread_id = res.body[5]._id;
            report_thread_id = res.body[9]._id;
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Test DELETE /api/threads/:board - incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/test/')
          .send({ delete_password: 'incorrect_password', thread_id: del_thread_id  })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('Test DELETE /api/threads/:board - correct password', function(done) {
        chai.request(server)
          .delete('/api/threads/test/')
          .send({ delete_password: 'password10', thread_id: del_thread_id  })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Test PUT /api/threads/:board - thread id not in db', function(done) {
        chai.request(server)
          .put('/api/threads/test/')
          .send({ thread_id: new ObjectId() })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'thread not found');
            done();
          });
      });

      test('Test PUT /api/threads/:board - thread id in db', function(done) {
        chai.request(server)
          .put('/api/threads/test/')
          .send({ thread_id: report_thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
       test('Test POST /api/replies/:board', function(done) {
        chai.request(server)
          .post('/api/replies/test/')
          .send({
            delete_password: 'reply_password',
            text: 'reply',
            thread_id: reply_thread_id,
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Test GET /api/replies/:board', function(done) {
        chai.request(server)
          .get('/api/replies/test/')
          .query({ thread_id: reply_thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'created_on');
            assert.equal(res.body._id, reply_thread_id);
            assert.isArray(res.body.replies);
            assert.property(res.body.replies[0], 'created_on');
            assert.property(res.body.replies[0], '_id');
            reply_id = res.body.replies[0]._id;
            assert.equal(res.body.replies[0].text, 'reply');
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Test PUT /api/replies/:board - reply id not in db', function(done) {
        chai.request(server)
          .put('/api/replies/test/')
          .send({ reply_id: new ObjectId(), thread_id: reply_thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'No match found');
            done();
          });
      });

      test('Test PUT /api/replies/:board - thread id not in db', function(done) {
        chai.request(server)
          .put('/api/replies/test/')
          .send({ reply_id: reply_id, thread_id: new ObjectId() })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'No match found');
            done();
          });
      });

      test('Test PUT /api/replies/:board - both ids in db', function(done) {
        chai.request(server)
          .put('/api/replies/test/')
          .send({ reply_id: reply_id, thread_id: reply_thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
       test('Test DELETE /api/replies/:board - incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/test/')
          .send({
            delete_password: 'incorrect_password',
            reply_id: reply_id,
            thread_id: reply_thread_id,
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });

      test('Test DELETE /api/replies/:board - correct password', function(done) {
        chai.request(server)
          .delete('/api/replies/test/')
          .send({
            delete_password: 'reply_password',
            reply_id: reply_id,
            thread_id: reply_thread_id,
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
  });

});
