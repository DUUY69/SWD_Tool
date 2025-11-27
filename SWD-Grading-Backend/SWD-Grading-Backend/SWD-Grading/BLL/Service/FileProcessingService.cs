using BLL.Interface;
using DAL.Interface;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Model.Entity;
using Model.Enums;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SharpCompress.Archives;
using SharpCompress.Common;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;

namespace BLL.Service
{
	public class FileProcessingService : IFileProcessingService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IS3Service _s3Service;
		private readonly IDriveService _driveService;

		public FileProcessingService(IUnitOfWork unitOfWork, IS3Service s3Service, IDriveService driveService)
		{
			_unitOfWork = unitOfWork;
			_s3Service = s3Service;
			_driveService = driveService;
		}

		public async Task ProcessStudentSolutionsAsync(long examZipId)
		{
			var processSummary = new StringBuilder();
			int processedCount = 0;
			int successCount = 0;
			int errorCount = 0;
			var errors = new List<string>();

			try
			{
				// Get ExamZip record
				var examZip = await _unitOfWork.ExamZipRepository.GetByIdAsync(examZipId);
				if (examZip == null)
				{
					throw new Exception($"ExamZip with ID {examZipId} not found");
				}

				// Get Exam info
				var exam = await _unitOfWork.ExamRepository.GetByIdAsync(examZip.ExamId);
				if (exam == null)
				{
					throw new Exception($"Exam with ID {examZip.ExamId} not found");
				}

				// Check if ZIP file exists
				if (string.IsNullOrEmpty(examZip.ZipPath) || !File.Exists(examZip.ZipPath))
				{
					examZip.ParseStatus = ParseStatus.ERROR;
					examZip.ParseSummary = "ZIP file not found at specified path";
					await _unitOfWork.SaveChangesAsync();
					return;
				}

				// Create temp extraction directory
				var tempExtractPath = Path.Combine(Path.GetTempPath(), $"exam_{examZipId}_{Guid.NewGuid()}");
				Directory.CreateDirectory(tempExtractPath);

				try
				{
					// Extract main archive file (ZIP or RAR)
					var archiveExtension = Path.GetExtension(examZip.ZipPath).ToLower();
					if (archiveExtension == ".rar")
					{
						ExtractRarFile(examZip.ZipPath, tempExtractPath);
					}
					else
					{
						ZipFile.ExtractToDirectory(examZip.ZipPath, tempExtractPath);
					}
					examZip.ExtractedPath = tempExtractPath;

					// Find Student_Solutions folder (it might be at root or inside another folder)
					string studentSolutionsPath = tempExtractPath;
					var possiblePaths = new[]
					{
						Path.Combine(tempExtractPath, "Student_Solutions"),
						tempExtractPath
					};

					// Try to find Student_Solutions folder
					foreach (var path in possiblePaths)
					{
						if (Directory.Exists(path))
						{
							var dirs = Directory.GetDirectories(path);
							if (dirs.Length > 0)
							{
								studentSolutionsPath = path;
								break;
							}
						}
					}

					// Get all student folders
					var studentFolders = Directory.GetDirectories(studentSolutionsPath);
					processSummary.AppendLine($"Found {studentFolders.Length} student folders");

					foreach (var studentFolder in studentFolders)
					{
						processedCount++;
						var studentFolderName = Path.GetFileName(studentFolder);

						try
						{
							await ProcessStudentFolderAsync(studentFolder, studentFolderName, examZip, exam);
							successCount++;
						}
						catch (Exception ex)
						{
							errorCount++;
							var errorMsg = $"Error processing {studentFolderName}: {ex.Message}";
							errors.Add(errorMsg);
							processSummary.AppendLine(errorMsg);
						}
					}

					// Update ExamZip status
					examZip.ParseStatus = errorCount == processedCount ? ParseStatus.ERROR : ParseStatus.DONE;
					processSummary.AppendLine($"\nProcessing complete:");
					processSummary.AppendLine($"Total: {processedCount}");
					processSummary.AppendLine($"Success: {successCount}");
					processSummary.AppendLine($"Errors: {errorCount}");
					examZip.ParseSummary = processSummary.ToString();

					await _unitOfWork.SaveChangesAsync();
				}
				finally
				{
					// Cleanup temp directory after processing
					if (!string.IsNullOrEmpty(tempExtractPath) && Directory.Exists(tempExtractPath))
					{
						try
						{
							Directory.Delete(tempExtractPath, true);
						}
						catch (Exception ex)
						{
							Console.WriteLine($"Error cleaning up temp directory: {ex.Message}");
						}
					}

					// Delete uploaded ZIP file
					if (!string.IsNullOrEmpty(examZip.ZipPath) && File.Exists(examZip.ZipPath))
					{
						try
						{
							File.Delete(examZip.ZipPath);
						}
						catch (Exception ex)
						{
							Console.WriteLine($"Error deleting ZIP file: {ex.Message}");
						}
					}
				}
			}
			catch (Exception ex)
			{
				// Update ExamZip with error status
				var examZip = await _unitOfWork.ExamZipRepository.GetByIdAsync(examZipId);
				if (examZip != null)
				{
					examZip.ParseStatus = ParseStatus.ERROR;
					examZip.ParseSummary = $"Fatal error: {ex.Message}\n{ex.StackTrace}";
					await _unitOfWork.SaveChangesAsync();
				}
				throw;
			}
		}

	private async Task ProcessStudentFolderAsync(string studentFolderPath, string folderName, ExamZip examZip, Exam exam)
	{
		// Use entire folder name as StudentCode (e.g., "Anhddhse170283")
		var studentCode = folderName;

		// Query Student by StudentCode
		var student = await _unitOfWork.StudentRepository.GetByStudentCodeAsync(studentCode);
		if (student == null)
		{
			throw new Exception($"Student with code '{studentCode}' not found in database");
		}

		// Query ExamStudent by ExamId and StudentId
		var examStudent = await _unitOfWork.ExamStudentRepository.GetByExamAndStudentAsync(exam.Id, student.Id);
		if (examStudent == null)
		{
			throw new Exception($"ExamStudent record not found for Student '{studentCode}' in Exam '{exam.ExamCode}'");
		}

		// Look for folder "0" inside student folder
		var zeroFolderPath = Path.Combine(studentFolderPath, "0");
		if (!Directory.Exists(zeroFolderPath))
		{
			throw new Exception("Folder '0' not found");
		}

		// Get or create Exam folder on Drive
		if (string.IsNullOrEmpty(exam.DriveFolderId))
		{
			var (examFolderId, _) = await _driveService.GetOrCreateFolderAsync(exam.ExamCode);
			exam.DriveFolderId = examFolderId;
		}

		// Get or create Solutions folder inside Exam folder
		if (string.IsNullOrEmpty(exam.DriveSolutionsFolderId))
		{
			var (solutionsFolderId, _) = await _driveService.GetOrCreateFolderAsync("Student_Solutions", exam.DriveFolderId);
			exam.DriveSolutionsFolderId = solutionsFolderId;
		}

		// Get or create Student folder inside Solutions folder
		var (studentFolderId, _) = await _driveService.GetOrCreateFolderAsync(studentCode, exam.DriveSolutionsFolderId);

		// Check for document files directly in folder "0" first (.docx, .doc, .pdf)
		var existingDocxFiles = Directory.GetFiles(zeroFolderPath, "*.docx", SearchOption.TopDirectoryOnly)
			.Where(f => !Path.GetFileName(f).StartsWith("~$")) // Exclude temp Word files
			.ToList();
		var existingDocFiles = Directory.GetFiles(zeroFolderPath, "*.doc", SearchOption.TopDirectoryOnly)
			.Where(f => !Path.GetFileName(f).StartsWith("~$"))
			.ToList();
		var existingPdfFiles = Directory.GetFiles(zeroFolderPath, "*.pdf", SearchOption.TopDirectoryOnly)
			.ToList();

		// Check for solution.zip or solution.rar
		var solutionZipPath = Path.Combine(zeroFolderPath, "solution.zip");
		var solutionRarPath = Path.Combine(zeroFolderPath, "solution.rar");
		var hasSolutionZip = File.Exists(solutionZipPath);
		var hasSolutionRar = File.Exists(solutionRarPath);

		// Upload solution.zip or solution.rar to Drive if exists
		string? solutionZipDriveFileId = null;
		if (hasSolutionZip)
		{
			using (var zipFileStream = File.OpenRead(solutionZipPath))
			{
				var (fileId, webViewLink) = await _driveService.UploadFileAsync(zipFileStream, "solution.zip", studentFolderId);
				solutionZipDriveFileId = fileId;
			}
		}
		else if (hasSolutionRar)
		{
			using (var rarFileStream = File.OpenRead(solutionRarPath))
			{
				var (fileId, webViewLink) = await _driveService.UploadFileAsync(rarFileStream, "solution.rar", studentFolderId);
				solutionZipDriveFileId = fileId;
			}
		}

			List<string> allDocumentFiles = new List<string>();

			// Add existing files from folder 0
			allDocumentFiles.AddRange(existingDocxFiles);
			allDocumentFiles.AddRange(existingDocFiles);
			allDocumentFiles.AddRange(existingPdfFiles);

			// Extract solution.zip or solution.rar if exists to find more files
			if (hasSolutionZip || hasSolutionRar)
			{
				var tempSolutionExtractPath = Path.Combine(Path.GetTempPath(), $"solution_{Guid.NewGuid()}");
				Directory.CreateDirectory(tempSolutionExtractPath);

				try
				{
					if (hasSolutionZip)
					{
						ZipFile.ExtractToDirectory(solutionZipPath, tempSolutionExtractPath);
					}
					else if (hasSolutionRar)
					{
						ExtractRarFile(solutionRarPath, tempSolutionExtractPath);
					}

					// Find all document files in extracted archive (.docx, .doc, .pdf)
					var docxFilesInArchive = Directory.GetFiles(tempSolutionExtractPath, "*.docx", SearchOption.AllDirectories)
						.Where(f => !Path.GetFileName(f).StartsWith("~$"))
						.ToList();
					var docFilesInArchive = Directory.GetFiles(tempSolutionExtractPath, "*.doc", SearchOption.AllDirectories)
						.Where(f => !Path.GetFileName(f).StartsWith("~$"))
						.ToList();
					var pdfFilesInArchive = Directory.GetFiles(tempSolutionExtractPath, "*.pdf", SearchOption.AllDirectories)
						.ToList();

					allDocumentFiles.AddRange(docxFilesInArchive);
					allDocumentFiles.AddRange(docFilesInArchive);
					allDocumentFiles.AddRange(pdfFilesInArchive);

					// Check for nested archives (ZIP or RAR inside the extracted archive)
					var nestedZips = Directory.GetFiles(tempSolutionExtractPath, "*.zip", SearchOption.AllDirectories).ToList();
					var nestedRars = Directory.GetFiles(tempSolutionExtractPath, "*.rar", SearchOption.AllDirectories).ToList();

					foreach (var nestedZip in nestedZips)
					{
						var nestedExtractPath = Path.Combine(tempSolutionExtractPath, $"nested_{Guid.NewGuid()}");
						Directory.CreateDirectory(nestedExtractPath);
						try
						{
							ZipFile.ExtractToDirectory(nestedZip, nestedExtractPath);
							var nestedDocs = Directory.GetFiles(nestedExtractPath, "*.docx", SearchOption.AllDirectories)
								.Concat(Directory.GetFiles(nestedExtractPath, "*.doc", SearchOption.AllDirectories))
								.Concat(Directory.GetFiles(nestedExtractPath, "*.pdf", SearchOption.AllDirectories))
								.Where(f => !Path.GetFileName(f).StartsWith("~$"))
								.ToList();
							allDocumentFiles.AddRange(nestedDocs);
						}
						catch (Exception ex)
						{
							Console.WriteLine($"Error extracting nested ZIP {nestedZip}: {ex.Message}");
						}
					}

					foreach (var nestedRar in nestedRars)
					{
						var nestedExtractPath = Path.Combine(tempSolutionExtractPath, $"nested_{Guid.NewGuid()}");
						Directory.CreateDirectory(nestedExtractPath);
						try
						{
							ExtractRarFile(nestedRar, nestedExtractPath);
							var nestedDocs = Directory.GetFiles(nestedExtractPath, "*.docx", SearchOption.AllDirectories)
								.Concat(Directory.GetFiles(nestedExtractPath, "*.doc", SearchOption.AllDirectories))
								.Concat(Directory.GetFiles(nestedExtractPath, "*.pdf", SearchOption.AllDirectories))
								.Where(f => !Path.GetFileName(f).StartsWith("~$"))
								.ToList();
							allDocumentFiles.AddRange(nestedDocs);
						}
						catch (Exception ex)
						{
							Console.WriteLine($"Error extracting nested RAR {nestedRar}: {ex.Message}");
						}
					}
				}
				catch (Exception ex)
				{
					Console.WriteLine($"Error extracting solution archive: {ex.Message}");
				}
			}

		// Process all document files found
		if (allDocumentFiles.Count == 0)
		{
			// No document files found - throw error to be caught by outer try-catch
			var errorMsg = (hasSolutionZip || hasSolutionRar)
				? "No document files (.docx, .doc, .pdf) found in folder '0' or solution archive" 
				: "Solution archive not found and no document files in folder '0'";
			throw new Exception(errorMsg);
		}

		// Process each document file
		foreach (var documentFilePath in allDocumentFiles)
		{
			var fileName = Path.GetFileName(documentFilePath);
			var fileExtension = Path.GetExtension(documentFilePath).ToLower();

			// Upload document file to Drive
			string driveFileId;
			string driveWebViewLink;
			using (var documentFileStream = File.OpenRead(documentFilePath))
			{
				var (fileId, webViewLink) = await _driveService.UploadFileAsync(documentFileStream, fileName, studentFolderId);
				driveFileId = fileId;
				driveWebViewLink = webViewLink;
			}

			// Extract text from document based on file type
			string? extractedText = null;
			string? parseMessage = null;
			DocParseStatus parseStatus;

			try
			{
				if (fileExtension == ".docx")
				{
					extractedText = ExtractTextFromWord(documentFilePath);
				}
				else if (fileExtension == ".doc")
				{
					extractedText = ExtractTextFromDoc(documentFilePath);
				}
				else if (fileExtension == ".pdf")
				{
					extractedText = ExtractTextFromPdf(documentFilePath);
				}
				else
				{
					throw new NotSupportedException($"Unsupported file type: {fileExtension}");
				}
				parseStatus = DocParseStatus.OK;
				parseMessage = "Successfully parsed";
			}
			catch (Exception ex)
			{
				parseStatus = DocParseStatus.ERROR;
				parseMessage = $"Error parsing document: {ex.Message}";
			}

			// Create DocFile record
			var docFile = new DocFile
			{
				ExamStudentId = examStudent.Id,
				ExamZipId = examZip.Id,
				FileName = fileName,
				FilePath = driveWebViewLink,
				DriveFileId = driveFileId,
				DriveWebViewLink = driveWebViewLink,
				ParsedText = extractedText,
				ParseStatus = parseStatus,
				ParseMessage = parseMessage
			};
			await _unitOfWork.DocFileRepository.AddAsync(docFile);
		}

		// Update ExamStudent status to PARSED
		examStudent.Status = ExamStudentStatus.PARSED;
		examStudent.Note = $"Processed {allDocumentFiles.Count} document file(s)";

		await _unitOfWork.SaveChangesAsync();
		}

	public string ExtractTextFromWord(string wordFilePath)
		{
			try
			{
				var text = new StringBuilder();

				using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(wordFilePath, false))
				{
					var body = wordDoc.MainDocumentPart?.Document?.Body;
					if (body == null)
					{
						return string.Empty;
					}

					// Extract all text from paragraphs
					foreach (var paragraph in body.Descendants<Paragraph>())
					{
						var paragraphText = paragraph.InnerText;
						if (!string.IsNullOrWhiteSpace(paragraphText))
						{
							text.AppendLine(paragraphText);
						}
					}

					// Extract text from tables
					foreach (var table in body.Descendants<Table>())
					{
						foreach (var row in table.Descendants<TableRow>())
						{
							var rowText = new List<string>();
							foreach (var cell in row.Descendants<TableCell>())
							{
								rowText.Add(cell.InnerText);
							}
							text.AppendLine(string.Join("\t", rowText));
						}
					}
				}

				return text.ToString();
			}
			catch (Exception ex)
			{
				throw new Exception($"Failed to extract text from Word document: {ex.Message}", ex);
			}
		}

		private void ExtractRarFile(string rarFilePath, string extractPath)
		{
			try
			{
				using (var archive = ArchiveFactory.Open(rarFilePath))
				{
					foreach (var entry in archive.Entries)
					{
						if (!entry.IsDirectory)
						{
							var entryPath = Path.Combine(extractPath, entry.Key);
							var entryDir = Path.GetDirectoryName(entryPath);
							if (!string.IsNullOrEmpty(entryDir) && !Directory.Exists(entryDir))
							{
								Directory.CreateDirectory(entryDir);
							}
							using (var entryStream = entry.OpenEntryStream())
							using (var fileStream = File.Create(entryPath))
							{
								entryStream.CopyTo(fileStream);
							}
						}
					}
				}
			}
			catch (Exception ex)
			{
				throw new Exception($"Failed to extract RAR file: {ex.Message}", ex);
			}
		}

		public string ExtractTextFromPdf(string pdfFilePath)
		{
			try
			{
				var text = new StringBuilder();
				using (var pdfReader = new PdfReader(pdfFilePath))
				using (var pdfDocument = new PdfDocument(pdfReader))
				{
					var numberOfPages = pdfDocument.GetNumberOfPages();
					
					for (int pageNum = 1; pageNum <= numberOfPages; pageNum++)
					{
						var page = pdfDocument.GetPage(pageNum);
						var strategy = new LocationTextExtractionStrategy();
						var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
						
						if (!string.IsNullOrWhiteSpace(pageText))
						{
							text.AppendLine(pageText);
						}
					}
				}
				return text.ToString();
			}
			catch (Exception ex)
			{
				throw new Exception($"Failed to extract text from PDF: {ex.Message}", ex);
			}
		}

		public string ExtractTextFromDoc(string docFilePath)
		{
			// Note: Word 97 (.doc) parsing requires NPOI.HWPF which is not available for .NET 8.0
			// For now, we'll return a placeholder message indicating the file was uploaded but not parsed
			// In the future, consider using Aspose.Words or another library that supports .doc files on .NET 8.0
			throw new NotSupportedException("Word 97 (.doc) file parsing is not currently supported. The file has been uploaded to Google Drive but text extraction is not available. Please convert the file to .docx format for text extraction.");
		}
	}
}

