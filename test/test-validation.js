/**
 * Automated test script to verify Task Manager API validation and CRUD functionality.
 * Runs directly with: node test/test-validation.js or npm test
 */
const http = require('http');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test_env';
process.env.PORT = '5050';

const app = require('../server');

const TEST_PORT = 5050;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper to make HTTP requests
const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

let passed = 0;
let failed = 0;

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting Task Manager API & Validation Test Suite');
  console.log('======================================================\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Root route
    console.log('--- 1. Root Endpoint ---');
    const rootRes = await request('GET', '/');
    assert(rootRes.status === 200, 'GET / returns 200 OK');

    // Future date helper
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateIso = futureDate.toISOString();

    // 2. Valid POST /tasks
    console.log('\n--- 2. Valid POST /tasks (Valid payload with future dueDate) ---');
    const validTaskPayload = {
      title: 'Complete Codetrain Backend Assignment',
      description: 'Add express-validator to task routes and handle errors',
      completed: false,
      dueDate: futureDateIso,
    };
    const validPostRes = await request('POST', '/tasks', validTaskPayload);
    assert(validPostRes.status === 201, 'POST /tasks returns 201 Created', JSON.stringify(validPostRes.data));
    assert(validPostRes.data.data && validPostRes.data.data.title === validTaskPayload.title, 'Created task has correct title');
    const createdTaskId = validPostRes.data.data ? (validPostRes.data.data.id || validPostRes.data.data._id) : null;
    assert(mongoose.Types.ObjectId.isValid(createdTaskId), `Created task ID is a valid Mongo ObjectId (${createdTaskId})`);

    // 3. Invalid POST: Missing title
    console.log('\n--- 3. Invalid POST /tasks (Missing title) ---');
    const missingTitleRes = await request('POST', '/tasks', {
      description: 'Task without a title',
      completed: false,
    });
    assert(missingTitleRes.status === 400, 'POST /tasks without title returns 400 Bad Request', `Got status ${missingTitleRes.status}`);
    assert(
      Array.isArray(missingTitleRes.data.errors) && missingTitleRes.data.errors.some((e) => e.field === 'title'),
      'Error response contains validation message for title field',
      JSON.stringify(missingTitleRes.data)
    );

    // 4. Invalid POST: Empty title string
    console.log('\n--- 4. Invalid POST /tasks (Empty/Whitespace title) ---');
    const emptyTitleRes = await request('POST', '/tasks', {
      title: '   ',
      completed: false,
    });
    assert(emptyTitleRes.status === 400, 'POST /tasks with whitespace title returns 400 Bad Request', `Got status ${emptyTitleRes.status}`);

    // 5. Invalid POST: Wrong type for completed
    console.log('\n--- 5. Invalid POST /tasks (Invalid completed type) ---');
    const invalidCompletedRes = await request('POST', '/tasks', {
      title: 'Valid Title',
      completed: 'invalid-boolean-value',
    });
    assert(invalidCompletedRes.status === 400, 'POST /tasks with invalid completed type returns 400 Bad Request', `Got status ${invalidCompletedRes.status}`);
    assert(
      Array.isArray(invalidCompletedRes.data.errors) && invalidCompletedRes.data.errors.some((e) => e.field === 'completed'),
      'Error response contains validation message for completed field',
      JSON.stringify(invalidCompletedRes.data)
    );

    // 6. Invalid POST: Invalid dueDate format
    console.log('\n--- 6. Invalid POST /tasks (Invalid dueDate format) ---');
    const invalidDateRes = await request('POST', '/tasks', {
      title: 'Valid Title',
      dueDate: 'not-a-date-format',
    });
    assert(invalidDateRes.status === 400, 'POST /tasks with non-ISO dueDate returns 400 Bad Request', `Got status ${invalidDateRes.status}`);

    // 7. Invalid POST: Past dueDate (Assignment Requirement 1)
    console.log('\n--- 7. Invalid POST /tasks (Past dueDate earlier than today) ---');
    const pastDateRes = await request('POST', '/tasks', {
      title: 'Task with Past Due Date',
      dueDate: '2020-01-01T00:00:00.000Z',
    });
    assert(pastDateRes.status === 400, 'POST /tasks with past dueDate returns 400 Bad Request', `Got status ${pastDateRes.status}`);
    assert(
      Array.isArray(pastDateRes.data.errors) && pastDateRes.data.errors.some((e) => e.field === 'dueDate' && e.message.includes('earlier than today')),
      'Error response contains message that dueDate cannot be earlier than today',
      JSON.stringify(pastDateRes.data)
    );

    // 8. GET /tasks
    console.log('\n--- 8. GET /tasks (Retrieve list) ---');
    const getTasksRes = await request('GET', '/tasks');
    assert(getTasksRes.status === 200, 'GET /tasks returns 200 OK');
    assert(Array.isArray(getTasksRes.data.data) && getTasksRes.data.data.length >= 1, 'GET /tasks returns array with created task');

    // 9. GET /tasks?completed=true & GET /tasks?completed=false (Assignment Requirement 3 - Stretch Goal Filter)
    console.log('\n--- 9. GET /tasks with valid query filter (?completed=true/false) ---');
    const getCompletedFalseRes = await request('GET', '/tasks?completed=false');
    assert(getCompletedFalseRes.status === 200, 'GET /tasks?completed=false returns 200 OK');
    assert(getCompletedFalseRes.data.data.every((t) => t.completed === false), 'All returned tasks have completed: false');

    const getCompletedTrueRes = await request('GET', '/tasks?completed=true');
    assert(getCompletedTrueRes.status === 200, 'GET /tasks?completed=true returns 200 OK');

    // 10. Invalid GET /tasks?completed=invalid (Assignment Requirement 3)
    console.log('\n--- 10. Invalid GET /tasks?completed=invalid (Query validation) ---');
    const invalidQueryRes = await request('GET', '/tasks?completed=yes');
    assert(invalidQueryRes.status === 400, "GET /tasks?completed=yes returns 400 Bad Request", `Got status ${invalidQueryRes.status}`);
    assert(
      Array.isArray(invalidQueryRes.data.errors) && invalidQueryRes.data.errors.some((e) => e.field === 'completed'),
      'Error response contains validation error for completed query parameter',
      JSON.stringify(invalidQueryRes.data)
    );

    // 11. Invalid param('id').isMongoId() on GET, PUT, DELETE (Assignment Requirement 2)
    console.log('\n--- 11. Invalid param ID validation (GET, PUT, DELETE /tasks/:id) ---');
    const invalidId = 'not-a-valid-mongo-id';

    const invalidGetIdRes = await request('GET', `/tasks/${invalidId}`);
    assert(invalidGetIdRes.status === 400, 'GET /tasks/invalid-id returns 400 Bad Request before querying DB', `Got status ${invalidGetIdRes.status}`);
    assert(
      Array.isArray(invalidGetIdRes.data.errors) && invalidGetIdRes.data.errors.some((e) => e.field === 'id'),
      'GET invalid ID response contains ID validation error',
      JSON.stringify(invalidGetIdRes.data)
    );

    const invalidPutIdRes = await request('PUT', `/tasks/${invalidId}`, { title: 'Update' });
    assert(invalidPutIdRes.status === 400, 'PUT /tasks/invalid-id returns 400 Bad Request', `Got status ${invalidPutIdRes.status}`);

    const invalidDeleteIdRes = await request('DELETE', `/tasks/${invalidId}`);
    assert(invalidDeleteIdRes.status === 400, 'DELETE /tasks/invalid-id returns 400 Bad Request', `Got status ${invalidDeleteIdRes.status}`);

    // 12. Valid GET /tasks/:id
    console.log('\n--- 12. Valid GET /tasks/:id (Retrieve single task) ---');
    if (createdTaskId) {
      const getSingleRes = await request('GET', `/tasks/${createdTaskId}`);
      assert(getSingleRes.status === 200, `GET /tasks/${createdTaskId} returns 200 OK`);
      assert(getSingleRes.data.data && (getSingleRes.data.data.id === createdTaskId || getSingleRes.data.data._id === createdTaskId), 'Returned correct task ID');
    }

    // 13. Valid PUT /tasks/:id
    console.log('\n--- 13. Valid PUT /tasks/:id (Update task) ---');
    if (createdTaskId) {
      const updateRes = await request('PUT', `/tasks/${createdTaskId}`, {
        title: 'Updated Codetrain Task Title',
        completed: true,
      });
      assert(updateRes.status === 200, 'PUT /tasks/:id returns 200 OK', JSON.stringify(updateRes.data));
      assert(updateRes.data.data && updateRes.data.data.completed === true, 'Task completed status was updated to true');
    }

    // 14. Invalid PUT /tasks/:id (Past dueDate)
    console.log('\n--- 14. Invalid PUT /tasks/:id (Past dueDate on update) ---');
    if (createdTaskId) {
      const invalidPutDueDateRes = await request('PUT', `/tasks/${createdTaskId}`, {
        dueDate: '2021-05-10T10:00:00.000Z',
      });
      assert(invalidPutDueDateRes.status === 400, 'PUT /tasks/:id with past dueDate returns 400 Bad Request');
    }

    // 15. Non-existent valid MongoId (404 Not Found)
    console.log('\n--- 15. Non-existent valid MongoId (404 Not Found) ---');
    const nonExistentMongoId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await request('GET', `/tasks/${nonExistentMongoId}`);
    assert(notFoundRes.status === 404, `GET /tasks/${nonExistentMongoId} returns 404 Not Found`);

    // 16. DELETE /tasks/:id
    console.log('\n--- 16. DELETE /tasks/:id (Delete task) ---');
    if (createdTaskId) {
      const deleteRes = await request('DELETE', `/tasks/${createdTaskId}`);
      assert(deleteRes.status === 200, 'DELETE /tasks/:id returns 200 OK');

      // Verify it's gone
      const getDeletedRes = await request('GET', `/tasks/${createdTaskId}`);
      assert(getDeletedRes.status === 404, 'GET on deleted task returns 404 Not Found');
    }

    // Summary
    console.log('\n======================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    server.close();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    server.close();
    process.exit(1);
  }
};

runTests();
