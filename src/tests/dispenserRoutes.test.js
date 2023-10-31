const request = require('supertest');
const app = require('../app'); 

describe('POST /api/dispensers', () => {
  test('It should create a dispenser and respond with a 200 status code', async () => {
    const response = await request(app)
      .post('/api/dispensers')
      .send({ flowVolume: 0.064 }); 
    expect(response.statusCode).toBe(200);
  });
});

describe('PUT /api/dispensers/:id/status', () => {
  let dispenserId;

  beforeAll(async () => {
    const createResponse = await request(app)
      .post('/api/dispensers')
      .send({ flowVolume: 0.064 }); 
    dispenserId = createResponse.body.dispenser_id;
  });

  // Test opening the tap
  test('It should respond with a 200 status code when opening the tap', async () => {
    const response = await request(app)
      .put(`/api/dispensers/${dispenserId}/status`)
      .send({ status: 'open' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'open', start_time: expect.any(String) });
  });

  // Test closing the tap
  test('It should respond with a 200 status code when closing the tap', async () => {
    const response = await request(app)
      .put(`/api/dispensers/${dispenserId}/status`)
      .send({ status: 'close' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'closed', end_time: expect.any(String), revenue: expect.any(String) });
  });

});


describe('GET /api/dispensers/:id/spending', () => {
  let dispenserId;

  beforeAll(async () => {
    const createResponse = await request(app)
      .post('/api/dispensers')
      .send({ flowVolume: 0.064 });
    dispenserId = createResponse.body.dispenser_id;
  });

  test('It should respond with a 200 status code', async () => {
    const response = await request(app).get(`/api/dispensers/${dispenserId}/spending`);
    expect(response.statusCode).toBe(200);
  });

  test('It should respond with a 404 status code for an invalid dispenser ID', async () => {
    const invalidDispenserId = 'invalid-uuid';
    const response = await request(app).get(`/api/dispensers/${invalidDispenserId}/spending`);
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Dispenser not found' });
  });
  

  test('It should respond with expected spending data', async () => {
    const response = await request(app).get(`/api/dispensers/${dispenserId}/spending`);

    // console.log("response: " + JSON.stringify(response));

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('amount');
    expect(response.body).toHaveProperty('usages');
    expect(Array.isArray(response.body.usages)).toBe(true);
    expect(typeof response.body.amount).toBe('string');
    
    const expectedData = {
      amount: "57.678",
      usages: [
        {
          opened_at: "2022-01-01T02:00:00Z",
          closed_at: "2022-01-01T02:00:50Z",
          flow_volume: 0.064,
          total_spent: "39.2"
        },
        {
          opened_at: "2022-01-01T02:50:58Z",
          closed_at: "2022-01-01T02:51:20Z",
          flow_volume: 0.064,
          total_spent: "17.248"
        },
        {
          opened_at: "2022-01-01T13:50:58Z",
          closed_at: null,
          flow_volume: 0.064,
          total_spent: "1.23"
        }
      ]
    };
  
    
    // Assert each individual "usage" data structure from mock data
    expectedData.usages.forEach((expectedUsage) => { 
      if (expectedUsage) {
        expect(expectedUsage).toHaveProperty('opened_at');
        expect(expectedUsage).toHaveProperty('closed_at');
        expect(expectedUsage).toHaveProperty('flow_volume');
        expect(expectedUsage).toHaveProperty('total_spent');

        expect(typeof expectedUsage.opened_at).toBe('string');
        expect(expectedUsage.closed_at === null || typeof expectedUsage.closed_at === 'string').toBeTruthy();
        expect(typeof expectedUsage.flow_volume).toBe('number');
        expect(typeof expectedUsage.total_spent).toBe('string');
      }
      
    });
  });
  
});

