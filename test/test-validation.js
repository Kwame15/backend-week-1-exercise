/**
 * Automated test script to verify Task Manager API validation and CRUD functionality.
 * Runs directly with: node test/test-validation.js or npm test
 */
const http = require('http');

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

    // 2. Valid POST /tasks
    console.log('\n--- 2. Valid POST /tasks (Valid payload) ---');
    const validTaskPayload = {
      title: 'Complete Codetrain Backend Exercise',
      description: 'Add express-validator to task routes and handle errors',
      completed: false,
      dueDate: '2026-09-05T18:00:00.000Z',
    };
    const validPostRes = await request('POST', '/tasks', validTaskPayload);
    assert(validPostRes.status === 201, 'POST /tasks returns 201 Created', JSON.stringify(validPostRes.data));
    assert(validPostRes.data.data && validPostRes.data.data.title === validTaskPayload.title, 'Created task has correct title');
    const createdTaskId = validPostRes.data.data ? (validPostRes.data.data.id || validPostRes.data.data._id) : null;

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

    // 5. Invalid POST: Wrong type for completed (string "not-a-bool")
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
    assert(invalidDateRes.status === 400, 'POST /tasks with invalid dueDate returns 400 Bad Request', `Got status ${invalidDateRes.status}`);
    assert(
      Array.isArray(invalidDateRes.data.errors) && invalidDateRes.data.errors.some((e) => e.field === 'dueDate'),
      'Error response contains validation message for dueDate field',
      JSON.stringify(invalidDateRes.data)
    );

    // 7. GET /tasks
    console.log('\n--- 7. GET /tasks (Retrieve list) ---');
    const getTasksRes = await request('GET', '/tasks');
    assert(getTasksRes.status === 200, 'GET /tasks returns 200 OK');
    assert(Array.isArray(getTasksRes.data.data) && getTasksRes.data.data.length >= 1, 'GET /tasks returns array with created task');

    // 8. GET /tasks/:id
    console.log('\n--- 8. GET /tasks/:id (Retrieve single task) ---');
    if (createdTaskId) {
      const getSingleRes = await request('GET', `/tasks/${createdTaskId}`);
      assert(getSingleRes.status === 200, `GET /tasks/${createdTaskId} returns 200 OK`);
    }

    // 9. Valid PUT /tasks/:id
    console.log('\n--- 9. Valid PUT /tasks/:id (Update task) ---');
    if (createdTaskId) {
      const updateRes = await request('PUT', `/tasks/${createdTaskId}`, {
        title: 'Updated Task Title',
        completed: true,
      });
      assert(updateRes.status === 200, 'PUT /tasks/:id returns 200 OK', JSON.stringify(updateRes.data));
      assert(updateRes.data.data && updateRes.data.data.completed === true, 'Task completed status was updated to true');
    }

    // 10. Invalid PUT /tasks/:id (Invalid completed value)
    console.log('\n--- 10. Invalid PUT /tasks/:id (Validation failure on update) ---');
    if (createdTaskId) {
      const invalidPutRes = await request('PUT', `/tasks/${createdTaskId}`, {
        completed: 'not_boolean',
      });
      assert(invalidPutRes.status === 400, 'PUT /tasks/:id with invalid completed value returns 400 Bad Request');
    }

    // 11. DELETE /tasks/:id
    console.log('\n--- 11. DELETE /tasks/:id (Delete task) ---');
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
