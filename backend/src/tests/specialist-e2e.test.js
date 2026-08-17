const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const setup = require('./setup');
const User = require('../models/User');
const Application = require('../models/Application');

let customerToken, specialistToken;
let customerId, specialistId;

beforeAll(async () => {
  await setup.connect();
});

afterAll(async () => {
  await setup.closeDatabase();
});

afterEach(async () => {
  await setup.clearDatabase();
});

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
}

describe('Specialist End-to-End Workflow', () => {
  
  beforeEach(async () => {
    const customer = new User({ 
      phone: '777777777', 
      passwordHash: 'x', 
      name: 'Test Customer', 
      role: 'user' 
    });
    await customer.save();
    customerId = customer._id;
    customerToken = makeToken(customer);
    
    const specialist = new User({ 
      phone: '888888888', 
      passwordHash: 'x', 
      name: 'Test Specialist', 
      role: 'specialist',
    });
    await specialist.save();
    specialistId = specialist._id;
    specialistToken = makeToken(specialist);
  });

  test('Lock chat for non-selected specialists after client chooses one specialist', async () => {
    const secondSpecialist = new User({
      phone: '999999999',
      passwordHash: 'x',
      name: 'Second Specialist',
      role: 'specialist',
    });
    await secondSpecialist.save();
    const secondSpecialistToken = makeToken(secondSpecialist);

    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Website redesign', budgetMin: 5000, budgetMax: 15000 });
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data._id;

    const firstResponse = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ message: 'I can do it', offeredPrice: 7000 });
    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${secondSpecialistToken}`)
      .send({ message: 'I can do it too', offeredPrice: 8000 });
    expect(secondResponse.status).toBe(201);

    const accepted = await request(app)
      .post(`/api/applications/${applicationId}/responses/${firstResponse.body.data._id}/accept`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(accepted.status).toBe(200);

    const conversationRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ participants: [customerId, secondSpecialist._id], applicationId });
    expect(conversationRes.status).toBe(201);

    const blockedMessage = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${secondSpecialistToken}`)
      .send({
        conversationId: conversationRes.body.data._id,
        to: customerId,
        text: 'I still want to help',
      });

    expect(blockedMessage.status).toBe(403);
    expect(blockedMessage.body.message).toMatch(/доступ|закрыт|не открыт/i);
  });

  test('Selected specialist CAN send a message before customer writes the first message', async () => {
    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Landing page fix', budgetMin: 5000, budgetMax: 12000 });

    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data._id;

    const responseRes = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ message: 'I can do it', offeredPrice: 7000 });

    expect(responseRes.status).toBe(201);

    const acceptRes = await request(app)
      .post(`/api/applications/${applicationId}/responses/${responseRes.body.data._id}/accept`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.application.pendingSpecialistConfirmation).toBe(true);

    const conversationRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ participants: [customerId, specialistId], applicationId });

    expect(conversationRes.status).toBe(201);

    const allowedMessage = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ conversationId: conversationRes.body.data._id, to: customerId, text: 'Я хочу написать до первого сообщения заказчика.' });

    expect(allowedMessage.status).toBe(201);
    console.log('✓ Step: Selected specialist CAN message before customer first contact');
  });

  test('Specialist can reply in chat after customer starts first message but before acceptance', async () => {
    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Branding update', budgetMin: 3000, budgetMax: 9000 });

    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data._id;

    const responseRes = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ message: 'I can do this', offeredPrice: 5000 });

    expect(responseRes.status).toBe(201);

    const conversationRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ participants: [customerId, specialistId], applicationId });

    expect(conversationRes.status).toBe(201);

    const customerFirstMessage = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ conversationId: conversationRes.body.data._id, to: specialistId, text: 'Здравствуйте, хотели бы обсудить детали.' });

    expect(customerFirstMessage.status).toBe(201);

    const specialistReply = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ conversationId: conversationRes.body.data._id, to: customerId, text: 'Да, готов обсудить детали и стоимость.' });

    expect(specialistReply.status).toBe(201);
    expect(specialistReply.body.data.text).toContain('обсудить');
  });

  test('Single review updates specialist rating cache for filtering', async () => {
    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Update website banner',
        budgetMin: 3000,
        budgetMax: 8000,
      });

    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data._id;

    const respRes = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ message: 'I can help', offeredPrice: 5000 });

    expect(respRes.status).toBe(201);

    const acceptRes = await request(app)
      .post(`/api/applications/${applicationId}/responses/${respRes.body.data._id}/accept`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(acceptRes.status).toBe(200);

    const confirmRes = await request(app)
      .post(`/api/applications/${applicationId}/responses/${respRes.body.data._id}/confirm`)
      .set('Authorization', `Bearer ${specialistToken}`);

    expect(confirmRes.status).toBe(200);

    const completeRes = await request(app)
      .post(`/api/applications/${applicationId}/markWorkComplete`)
      .set('Authorization', `Bearer ${specialistToken}`);

    expect(completeRes.status).toBe(200);

    const acceptWorkRes = await request(app)
      .post(`/api/applications/${applicationId}/acceptWork`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(acceptWorkRes.status).toBe(200);

    const reviewRes = await request(app)
      .post(`/api/applications/${applicationId}/createReview`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, text: 'Excellent work! It was done very professionally.' });

    expect(reviewRes.status).toBe(200 || 201);

    const specialistUser = await User.findById(specialistId);
    expect(specialistUser.rating).toBe(5);
    expect(specialistUser.reviewsCount).toBe(1);

    const filteredRes = await request(app)
      .get('/api/users')
      .query({ role: 'specialist', minRating: 4.5 });

    expect(filteredRes.status).toBe(200);
    const found = filteredRes.body.data.some(u => String(u._id) === String(specialistId));
    expect(found).toBe(true);
  });

  test('E2E: Full customer→specialist workflow: create → respond → accept → confirm → work → review → close', async () => {
    // STEP 1: Customer creates application
    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Fix electrical outlet',
        budgetMin: 5000,
        budgetMax: 10000,
      });
    
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data._id;
    expect(appRes.body.data.status).toBe('open');
    expect(appRes.body.data.active).toBe(true);
    console.log('✓ Step 1: Application created (status: open, active: true)');

    // STEP 2: Specialist sees public applications
    const publicRes = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${specialistToken}`);
    
    expect(publicRes.status).toBe(200);
    const foundApp = publicRes.body.data.find(a => String(a._id) === String(applicationId));
    expect(foundApp).toBeDefined();
    console.log('✓ Step 2: Specialist sees application in public feed');

    // STEP 3: Specialist responds to application
    const respRes = await request(app)
      .post(`/api/applications/${applicationId}/respond`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({
        message: 'I can do this job',
        offeredPrice: 7500,
      });
    
    expect(respRes.status).toBe(201);
    const responseId = respRes.body.data._id;
    expect(respRes.body.data.status).toBe('pending');
    console.log('✓ Step 3: Specialist created response (status: pending)');

    // STEP 4: Customer views specialist response
    const viewRes = await request(app)
      .get(`/api/applications/${applicationId}/responses`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.data.length).toBeGreaterThan(0);
    expect(String(viewRes.body.data[0].specialist._id)).toBe(String(specialistId));
    console.log('✓ Step 4: Customer views specialist response');

    // STEP 5: Customer accepts specialist response
    const acceptRes = await request(app)
      .post(`/api/applications/${applicationId}/responses/${responseId}/accept`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(acceptRes.status).toBe(200);
    expect(String(acceptRes.body.data.application.proposedSpecialist)).toBe(String(specialistId));
    expect(acceptRes.body.data.application.pendingSpecialistConfirmation).toBe(true);
    console.log('✓ Step 5: Customer accepted response (status: pending specialist confirmation)');

    // STEP 6: Specialist confirms proposal (job accepted, status → in_progress)
    const confirmRes = await request(app)
      .post(`/api/applications/${applicationId}/responses/${responseId}/confirm`)
      .set('Authorization', `Bearer ${specialistToken}`);
    
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.application.status).toBe('in_progress');
    expect(String(confirmRes.body.data.application.currentSpecialist)).toBe(String(specialistId));
    expect(confirmRes.body.data.application.active).toBe(false);
    console.log('✓ Step 6: Specialist confirmed proposal (status: in_progress, active: false)');

    // STEP 7: Verify application no longer in public feed
    const publicAfterRes = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${specialistToken}`);
    
    const foundAfter = publicAfterRes.body.data.find(a => String(a._id) === String(applicationId));
    expect(foundAfter).toBeUndefined();
    console.log('✓ Step 7: Confirmed - application hidden from public feed');

    // STEP 8: Specialist marks work as complete
    const completeRes = await request(app)
      .post(`/api/applications/${applicationId}/markWorkComplete`)
      .set('Authorization', `Bearer ${specialistToken}`);
    
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.workCompleted).toBe(true);
    console.log('✓ Step 8: Specialist marked work complete');

    // STEP 9: Customer accepts work
    const workAcceptRes = await request(app)
      .post(`/api/applications/${applicationId}/acceptWork`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(workAcceptRes.status).toBe(200);
    expect(workAcceptRes.body.data.workAccepted).toBe(true);
    expect(workAcceptRes.body.data.status).toBe('closed');
    console.log('✓ Step 9: Customer accepted work completion');

    // STEP 10: Customer submits review
    const custReviewRes = await request(app)
      .post(`/api/applications/${applicationId}/createReview`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        text: 'Excellent work! Very professional and fast.',
      });
    
    expect(custReviewRes.status).toBe(200 || 201);
    expect(custReviewRes.body.data.rating).toBe(5);
    console.log('✓ Step 10: Customer submitted review');

    // STEP 11: Specialist submits review (application closes)
    const specReviewRes = await request(app)
      .post(`/api/applications/${applicationId}/createReview`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({
        rating: 5,
        text: 'Great customer! Easy to work with.',
      });
    
    expect(specReviewRes.status).toBe(200 || 201);
    expect(specReviewRes.body.applicationClosed).toBe(true);
    console.log('✓ Step 11: Specialist submitted review, application closed');

    // STEP 12: Verify final state
    const finalRes = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.status).toBe('closed');
    expect(finalRes.body.data.workAccepted).toBe(true);
    expect(finalRes.body.data.workCompleted).toBe(true);
    console.log('✓ Step 12: Final state verified - application closed\n');
  });
});

