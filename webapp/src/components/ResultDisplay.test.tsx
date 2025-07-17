import { render, screen, fireEvent } from '@testing-library/react';
import ResultDisplay from './ResultDisplay';

// navigator.clipboard.writeText mock
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ResultDisplay', () => {
  const mockResults = ['첫 번째 결과', '두 번째 결과', '세 번째 결과'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all results correctly', () => {
    render(<ResultDisplay results={mockResults} />);

    mockResults.forEach(result => {
      expect(screen.getByText(result)).toBeInTheDocument();
    });
  });

  it('renders copy buttons for each result', () => {
    render(<ResultDisplay results={mockResults} />);

    const copyButtons = screen.getAllByText('복사');
    expect(copyButtons).toHaveLength(mockResults.length);
  });

  it('calls clipboard.writeText when copy button is clicked', () => {
    render(<ResultDisplay results={mockResults} />);

    const firstCopyButton = screen.getAllByText('복사')[0];
    fireEvent.click(firstCopyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResults[0]);
  });

  it('renders empty when no results provided', () => {
    const { container } = render(<ResultDisplay results={[]} />);
    
    expect(container.firstChild?.children).toHaveLength(0);
  });

  it('handles multiple copy button clicks correctly', () => {
    render(<ResultDisplay results={mockResults} />);

    const copyButtons = screen.getAllByText('복사');
    
    // 첫 번째와 세 번째 버튼 클릭
    fireEvent.click(copyButtons[0]);
    fireEvent.click(copyButtons[2]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(1, mockResults[0]);
    expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(2, mockResults[2]);
  });
});
