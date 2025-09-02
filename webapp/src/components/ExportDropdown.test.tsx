import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportDropdown } from './ExportDropdown';
import { StoryResponse } from '@/lib/english-story.types';

// Mock dependencies
jest.mock('@/lib/excel-utils', () => ({
    exportStoryToExcel: jest.fn(),
}));

jest.mock('@/lib/markdown-template', () => ({
    generateMarkdownFromTemplate: jest.fn(),
    getAvailableTemplates: jest.fn(),
}));

const mockStory: StoryResponse = {
    englishStory: '<p>This is a <strong>test</strong> story.</p>',
    koreanTranslation: '이것은 테스트 스토리입니다.',
    usedWords: [
        { englishWord: 'test', koreanMeaning: '테스트' }
    ],
    difficulty: 'medium'
};

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

// Mock file download
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('ExportDropdown', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateObjectURL.mockReturnValue('mock-url');

        // Mock markdown template functions
        const { generateMarkdownFromTemplate, getAvailableTemplates } = require('@/lib/markdown-template');
        generateMarkdownFromTemplate.mockReturnValue('# Generated Markdown Content');
        getAvailableTemplates.mockReturnValue([
            {
                key: 'default',
                name: '기본 템플릿',
                description: '기본적인 스토리 형식으로 구성된 템플릿'
            },
            {
                key: 'study',
                name: '학습용 템플릿',
                description: '학습 팁과 구조화된 형식의 템플릿'
            }
        ]);

        // Reset DOM
        document.body.innerHTML = '';
    }); afterEach(() => {
        cleanup();
    });

    it('드롭다운 버튼이 렌더링된다', () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        expect(exportButton).toBeInTheDocument();
    });

    it('드롭다운 버튼 클릭 시 메뉴가 표시된다', () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        expect(screen.getByText(/클립보드 복사/)).toBeInTheDocument();
        expect(screen.getByText(/Excel 내보내기/)).toBeInTheDocument();
        expect(screen.getByText(/Markdown 내보내기/)).toBeInTheDocument();
    });

    it('클립보드 복사 메뉴 클릭 시 텍스트가 클립보드에 복사된다', async () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const clipboardOption = screen.getByText(/클립보드 복사/);
        fireEvent.click(clipboardOption);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('This is a test story.');
        });
    });

    it('Excel 내보내기 메뉴 클릭 시 Excel 파일이 다운로드된다', async () => {
        const { exportStoryToExcel } = require('@/lib/excel-utils');
        exportStoryToExcel.mockResolvedValue(new Blob());

        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const excelOption = screen.getByText(/Excel 내보내기/);
        fireEvent.click(excelOption);

        await waitFor(() => {
            expect(exportStoryToExcel).toHaveBeenCalledWith(mockStory);
        });
    });

    it('Markdown 내보내기 메뉴 클릭 시 Markdown 파일이 다운로드된다', async () => {
        // Mock DOM element creation and click
        const mockLink = {
            click: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
        };
        jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        jest.spyOn(document.body, 'appendChild').mockImplementation();
        jest.spyOn(document.body, 'removeChild').mockImplementation();

        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const markdownOption = screen.getByText(/Markdown 내보내기/);
        fireEvent.click(markdownOption);

        await waitFor(() => {
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockCreateObjectURL).toHaveBeenCalled();
        });
    });

    it('드롭다운 외부 클릭 시 메뉴가 닫힌다', () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        expect(screen.getByText(/클립보드 복사/)).toBeInTheDocument();

        // 외부 클릭
        fireEvent.mouseDown(document.body);

        expect(screen.queryByText(/클립보드 복사/)).not.toBeInTheDocument();
    });

    it('메뉴 아이템 클릭 후 드롭다운이 닫힌다', async () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const clipboardOption = screen.getByText(/클립보드 복사/);
        fireEvent.click(clipboardOption);

        await waitFor(() => {
            expect(screen.queryByText(/클립보드 복사/)).not.toBeInTheDocument();
        });
    });

    it('키보드 ESC 키로 드롭다운이 닫힌다', () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        expect(screen.getByText(/클립보드 복사/)).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByText(/클립보드 복사/)).not.toBeInTheDocument();
    });

    it('Markdown 템플릿 메뉴 클릭 시 서브메뉴가 표시된다', () => {
        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const markdownOption = screen.getByText(/Markdown 내보내기/);
        fireEvent.click(markdownOption);

        expect(screen.getByText('기본 템플릿')).toBeInTheDocument();
        expect(screen.getByText('학습용 템플릿')).toBeInTheDocument();
    });

    it('템플릿 선택 시 해당 템플릿으로 Markdown이 생성된다', async () => {
        const { generateMarkdownFromTemplate } = require('@/lib/markdown-template');

        render(<ExportDropdown story={mockStory} />);

        const exportButton = screen.getByRole('button', { name: /내보내기/i });
        fireEvent.click(exportButton);

        const markdownOption = screen.getByText(/Markdown 내보내기/);
        fireEvent.click(markdownOption);

        const defaultTemplate = screen.getByText('기본 템플릿');
        fireEvent.click(defaultTemplate);

        await waitFor(() => {
            expect(generateMarkdownFromTemplate).toHaveBeenCalledWith(mockStory, 'default');
        });
    });
});
