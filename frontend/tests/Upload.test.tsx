import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Upload } from '../src/components/Upload';

describe('Upload Component', () => {
  it('renders upload button', () => {
    const mockOnImageSelect = vi.fn();
    render(<Upload onImageSelect={mockOnImageSelect} />);

    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
  });

  it('shows preview when image is selected', async () => {
    const mockOnImageSelect = vi.fn();
    render(<Upload onImageSelect={mockOnImageSelect} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('File input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  it('rejects invalid file types', () => {
    const mockOnImageSelect = vi.fn();
    render(<Upload onImageSelect={mockOnImageSelect} />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('File input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/only jpeg and png images are allowed/i)).toBeInTheDocument();
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  it('rejects files larger than 10MB', () => {
    const mockOnImageSelect = vi.fn();
    render(<Upload onImageSelect={mockOnImageSelect} />);

    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const input = screen.getByLabelText('File input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/file size must be less than 10mb/i)).toBeInTheDocument();
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  it('disables upload when disabled prop is true', () => {
    const mockOnImageSelect = vi.fn();
    render(<Upload onImageSelect={mockOnImageSelect} disabled />);

    const button = screen.getByRole('button', { name: /upload image/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});

