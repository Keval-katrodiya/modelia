import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Studio } from '../src/pages/Studio';
import * as api from '../src/utils/api';

// Mock the API
vi.mock('../src/utils/api', () => ({
  generationsAPI: {
    create: vi.fn(),
    getRecent: vi.fn(),
  },
  Generation: {},
}));

const mockGenerationsAPI = api.generationsAPI as {
  create: ReturnType<typeof vi.fn>;
  getRecent: ReturnType<typeof vi.fn>;
};

// Mock auth context
const mockUser = { id: 1, email: 'test@example.com' };
const mockToken = 'mock-token';

// Setup localStorage
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', mockToken);
  localStorage.setItem('user', JSON.stringify(mockUser));
  vi.clearAllMocks();
  mockGenerationsAPI.getRecent.mockResolvedValue([]);
});

const renderStudio = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Studio />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Generate Flow', () => {
  it('renders all generation form elements', async () => {
    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/upload image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/style/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });
  });

  it('shows loading state during generation', async () => {
    mockGenerationsAPI.create.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    });

    // Fill form
    const promptInput = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    // Create and select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('File input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit form
    const generateButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(generateButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });

  it('handles successful generation', async () => {
    const mockGeneration = {
      id: 1,
      user_id: 1,
      prompt: 'Test prompt',
      style: 'casual',
      image_url: '/uploads/test.jpg',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    mockGenerationsAPI.create.mockResolvedValue(mockGeneration);
    mockGenerationsAPI.getRecent.mockResolvedValue([mockGeneration]);

    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    });

    // Fill and submit form
    const promptInput = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('File input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const generateButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(generateButton);

    // Wait for success
    await waitFor(() => {
      expect(mockGenerationsAPI.create).toHaveBeenCalled();
    });
  });

  it('handles model overloaded error with retry', async () => {
    mockGenerationsAPI.create
      .mockRejectedValueOnce({
        response: { status: 503, data: { message: 'Model overloaded' } },
      })
      .mockResolvedValueOnce({
        id: 1,
        prompt: 'Test',
        style: 'casual',
        image_url: '/test.jpg',
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/prompt/i), { target: { value: 'Test' } });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Should show retry message
    await waitFor(() => {
      expect(mockGenerationsAPI.create).toHaveBeenCalledTimes(2);
    });
  });

  it('shows abort button during generation', async () => {
    mockGenerationsAPI.create.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/prompt/i), { target: { value: 'Test' } });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Check for abort button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /abort/i })).toBeInTheDocument();
    });
  });

  it('updates history after successful generation', async () => {
    const mockGeneration = {
      id: 1,
      user_id: 1,
      prompt: 'Test prompt',
      style: 'casual',
      image_url: '/uploads/test.jpg',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    mockGenerationsAPI.create.mockResolvedValue(mockGeneration);
    mockGenerationsAPI.getRecent
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockGeneration]);

    renderStudio();

    await waitFor(() => {
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    });

    // Submit generation
    fireEvent.change(screen.getByLabelText(/prompt/i), { target: { value: 'Test prompt' } });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Wait for history to update
    await waitFor(() => {
      expect(mockGenerationsAPI.getRecent).toHaveBeenCalledTimes(2);
    });
  });
});

