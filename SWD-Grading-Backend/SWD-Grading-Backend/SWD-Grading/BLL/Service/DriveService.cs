using BLL.Interface;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service
{
	public class GoogleDriveService : IDriveService
	{
		private readonly Google.Apis.Drive.v3.DriveService _driveService;
		private readonly string _rootFolderId;
		private readonly IConfiguration _configuration;

		public GoogleDriveService(IConfiguration configuration)
		{
			_configuration = configuration;
			_rootFolderId = configuration["GoogleDrive:RootFolderId"] ?? "1n2BySCLBP7vQ_sUdDWNldSs29Iof2L-Y";

			// Load service account credentials
			var credentialsPath = configuration["GoogleDrive:CredentialsPath"];
			if (string.IsNullOrEmpty(credentialsPath))
			{
				// Try to find the credentials file in the project root
				credentialsPath = Path.Combine(Directory.GetCurrentDirectory(), "tactical-crow-477907-v3-f82bca1b39a9.json");
			}
			else if (!Path.IsPathRooted(credentialsPath))
			{
				// If relative path, combine with current directory
				credentialsPath = Path.Combine(Directory.GetCurrentDirectory(), credentialsPath);
			}

			if (!System.IO.File.Exists(credentialsPath))
			{
				throw new FileNotFoundException($"Google Drive credentials file not found at: {credentialsPath}");
			}

			var credential = GoogleCredential.FromFile(credentialsPath)
				.CreateScoped(new[] { Google.Apis.Drive.v3.DriveService.Scope.Drive });

			_driveService = new Google.Apis.Drive.v3.DriveService(new BaseClientService.Initializer()
			{
				HttpClientInitializer = credential,
				ApplicationName = "SWD Grading System"
			});
		}

		public async Task<(string FileId, string WebViewLink)> UploadFileAsync(Stream fileStream, string fileName, string? parentFolderId = null)
		{
			try
			{
				var fileMetadata = new Google.Apis.Drive.v3.Data.File()
				{
					Name = fileName,
					Parents = parentFolderId != null ? new List<string> { parentFolderId } : new List<string> { _rootFolderId }
				};

				FilesResource.CreateMediaUpload request;
				request = _driveService.Files.Create(fileMetadata, fileStream, GetMimeType(fileName));
				request.Fields = "id, webViewLink, webContentLink";
				request.SupportsAllDrives = true;

				var uploadResult = await request.UploadAsync();

				if (uploadResult.Status != Google.Apis.Upload.UploadStatus.Completed)
				{
					throw new Exception($"Upload failed: {uploadResult.Exception?.Message}");
				}

				var file = request.ResponseBody;
				
				// Set permissions to allow anyone with link to view and edit
				await SetPublicPermissionAsync(file.Id, "writer");

				return (file.Id, file.WebViewLink);
			}
			catch (Exception ex)
			{
				throw new Exception($"Error uploading file to Google Drive: {ex.Message}", ex);
			}
		}

		public async Task<(string FolderId, string WebViewLink)> CreateFolderAsync(string folderName, string? parentFolderId = null)
		{
			try
			{
				var folderMetadata = new Google.Apis.Drive.v3.Data.File()
				{
					Name = folderName,
					MimeType = "application/vnd.google-apps.folder",
					Parents = parentFolderId != null ? new List<string> { parentFolderId } : new List<string> { _rootFolderId }
				};

				var request = _driveService.Files.Create(folderMetadata);
				request.Fields = "id, webViewLink";
				request.SupportsAllDrives = true;

				var folder = await request.ExecuteAsync();

				// Set permissions to allow anyone with link to view and edit
				await SetPublicPermissionAsync(folder.Id, "writer");

				return (folder.Id, folder.WebViewLink);
			}
			catch (Exception ex)
			{
				throw new Exception($"Error creating folder on Google Drive: {ex.Message}", ex);
			}
		}

		public async Task<(string FolderId, string WebViewLink)> GetOrCreateFolderAsync(string folderName, string? parentFolderId = null)
		{
			try
			{
				// Search for existing folder
				var searchParentId = parentFolderId ?? _rootFolderId;
				var query = $"name='{folderName.Replace("'", "\\'")}' and mimeType='application/vnd.google-apps.folder' and '{searchParentId}' in parents and trashed=false";

				var listRequest = _driveService.Files.List();
				listRequest.Q = query;
				listRequest.Fields = "files(id, webViewLink)";
				listRequest.PageSize = 1;
				listRequest.IncludeItemsFromAllDrives = true;
				listRequest.SupportsAllDrives = true;

				var result = await listRequest.ExecuteAsync();

				if (result.Files != null && result.Files.Count > 0)
				{
					var existingFolder = result.Files[0];
					return (existingFolder.Id, existingFolder.WebViewLink);
				}

				// Folder doesn't exist, create it
				return await CreateFolderAsync(folderName, parentFolderId);
			}
			catch (Exception ex)
			{
				throw new Exception($"Error getting or creating folder on Google Drive: {ex.Message}", ex);
			}
		}

		public async Task SetPublicPermissionAsync(string fileId, string role = "writer")
		{
			try
			{
				var permission = new Permission
				{
					Type = "anyone",
					Role = role // "reader" or "writer"
				};

				var request = _driveService.Permissions.Create(permission, fileId);
				request.SupportsAllDrives = true;
				await request.ExecuteAsync();
			}
			catch (Google.GoogleApiException ex) when (ex.Error.Code == 409)
			{
				// Permission already exists, ignore
			}
			catch (Google.GoogleApiException ex) when (ex.Error.Code == 403 &&
				ex.Error.Message != null &&
				ex.Error.Message.Contains("Cannot modify a permission", StringComparison.OrdinalIgnoreCase))
			{
				// Parent folder already exposes broader access; nothing else to do
				Console.WriteLine($"Skip setting permission because parent access is broader: {ex.Error.Message}");
			}
			catch (Exception ex)
			{
				throw new Exception($"Error setting permission on Google Drive: {ex.Message}", ex);
			}
		}

		public async Task<bool> DeleteFileAsync(string fileId)
		{
			try
			{
				var request = _driveService.Files.Delete(fileId);
				await request.ExecuteAsync();
				return true;
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error deleting file from Google Drive: {ex.Message}");
				return false;
			}
		}

		public async Task<string> GetFileDownloadUrlAsync(string fileId)
		{
			try
			{
				var request = _driveService.Files.Get(fileId);
				request.Fields = "webContentLink";
				var file = await request.ExecuteAsync();
				return file.WebContentLink ?? $"https://drive.google.com/file/d/{fileId}/view";
			}
			catch (Exception ex)
			{
				throw new Exception($"Error getting file download URL: {ex.Message}", ex);
			}
		}

		private string GetMimeType(string fileName)
		{
			var extension = Path.GetExtension(fileName).ToLower();
			return extension switch
			{
				".zip" => "application/zip",
				".rar" => "application/x-rar-compressed",
				".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				".doc" => "application/msword",
				".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				".xls" => "application/vnd.ms-excel",
				".pdf" => "application/pdf",
				".jpg" or ".jpeg" => "image/jpeg",
				".png" => "image/png",
				".gif" => "image/gif",
				_ => "application/octet-stream"
			};
		}
	}
}

