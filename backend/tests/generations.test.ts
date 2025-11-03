import request from 'supertest';
import app from '../src/index';
import db from '../src/db/database';
import path from 'path';
import fs from 'fs';

describe('Generations Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Clean up database
    db.exec('DELETE FROM generations');
    db.exec('DELETE FROM users');

    // Create a test user and get token
    const response = await request(app).post('/auth/signup').send({
      email: 'test@example.com',
      password: 'password123',
    });

    authToken = response.body.token;
    userId = response.body.user.id;

    // Create test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal valid JPEG
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);
      fs.writeFileSync(testImagePath, buffer);
    }
  });

  afterAll(() => {
    // Clean up test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  afterEach(() => {
    // Clean up generations after each test
    db.exec('DELETE FROM generations');
  });

  describe('POST /generations', () => {
    it('should create generation with valid data', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      // Retry logic to handle the 20% error rate
      let response;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        response = await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', 'A beautiful summer dress')
          .field('style', 'casual')
          .attach('image', testImagePath);

        if (response.status === 201) {
          break;
        }
        attempts++;
      }

      expect(response?.status).toBe(201);
      expect(response?.body).toHaveProperty('id');
      expect(response?.body).toHaveProperty('prompt', 'A beautiful summer dress');
      expect(response?.body).toHaveProperty('style', 'casual');
      expect(response?.body).toHaveProperty('image_url');
      expect(response?.body).toHaveProperty('status', 'completed');
    });

    it('should reject generation without authentication', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      const response = await request(app)
        .post('/generations')
        .field('prompt', 'A beautiful summer dress')
        .field('style', 'casual')
        .attach('image', testImagePath)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should reject generation without image', async () => {
      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A beautiful summer dress')
        .field('style', 'casual')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Image file is required');
    });

    it('should reject generation with invalid style', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A beautiful summer dress')
        .field('style', 'invalid-style')
        .attach('image', testImagePath)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle model overloaded error', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      // Try multiple times to hit the 20% error rate
      let foundOverloadError = false;

      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', 'A beautiful summer dress')
          .field('style', 'casual')
          .attach('image', testImagePath);

        if (response.status === 503) {
          expect(response.body).toHaveProperty('message', 'Model overloaded');
          foundOverloadError = true;
          break;
        }
      }

      // With 20 attempts, we should hit the error at least once
      expect(foundOverloadError).toBe(true);
    });
  });

  describe('GET /generations', () => {
    beforeEach(async () => {
      // Create some test generations
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      for (let i = 0; i < 7; i++) {
        let created = false;
        let attempts = 0;

        while (!created && attempts < 10) {
          const response = await request(app)
            .post('/generations')
            .set('Authorization', `Bearer ${authToken}`)
            .field('prompt', `Test prompt ${i}`)
            .field('style', 'casual')
            .attach('image', testImagePath);

          if (response.status === 201) {
            created = true;
          }
          attempts++;
        }
      }
    });

    it('should get recent generations (limit 5 by default)', async () => {
      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should respect custom limit', async () => {
      const response = await request(app)
        .get('/generations?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(3);
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get('/generations').expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return generations in descending order by creation date', async () => {
      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const prevDate = new Date(response.body[i - 1].created_at);
          const currDate = new Date(response.body[i].created_at);
          expect(prevDate >= currDate).toBe(true);
        }
      }
    });
  });
});

