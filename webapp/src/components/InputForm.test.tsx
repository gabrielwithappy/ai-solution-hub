import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputForm from './InputForm';

describe('InputForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders label and placeholder correctly', () => {
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="테스트 플레이스홀더"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText('테스트 라벨')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('테스트 플레이스홀더')).toBeInTheDocument();
  });

  it('submits form with input value', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="입력하세요"
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: '생성' });

    await user.type(textarea, '테스트 입력값');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('테스트 입력값');
  });

  it('disables submit button when input is empty', () => {
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="입력하세요"
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: '생성' });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="입력하세요"
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    expect(screen.getByText('생성 중...')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows character count correctly', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="입력하세요"
        onSubmit={mockOnSubmit}
        maxLength={100}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '테스트');

    expect(screen.getByText('3 / 100자')).toBeInTheDocument();
  });

  it('prevents submission when input exceeds maxLength', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        label="테스트 라벨"
        placeholder="입력하세요"
        onSubmit={mockOnSubmit}
        maxLength={5}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '12345678');

    // maxLength로 인해 5자만 입력됨
    expect(textarea).toHaveValue('12345');
  });
});
