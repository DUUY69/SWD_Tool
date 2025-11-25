using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interface
{
	public interface IDriveService
	{
		/// <summary>
		/// Upload file to Google Drive
		/// </summary>
		/// <param name="fileStream">File stream to upload</param>
		/// <param name="fileName">Name of the file</param>
		/// <param name="parentFolderId">Parent folder ID on Drive</param>
		/// <returns>Drive file ID and web view link</returns>
		Task<(string FileId, string WebViewLink)> UploadFileAsync(Stream fileStream, string fileName, string? parentFolderId = null);

		/// <summary>
		/// Create a folder on Google Drive
		/// </summary>
		/// <param name="folderName">Name of the folder</param>
		/// <param name="parentFolderId">Parent folder ID (optional)</param>
		/// <returns>Drive folder ID and web view link</returns>
		Task<(string FolderId, string WebViewLink)> CreateFolderAsync(string folderName, string? parentFolderId = null);

		/// <summary>
		/// Get or create folder (if exists, return it; if not, create new)
		/// </summary>
		/// <param name="folderName">Name of the folder</param>
		/// <param name="parentFolderId">Parent folder ID (optional)</param>
		/// <returns>Drive folder ID and web view link</returns>
		Task<(string FolderId, string WebViewLink)> GetOrCreateFolderAsync(string folderName, string? parentFolderId = null);

		/// <summary>
		/// Set file/folder permissions to allow anyone with link to view and edit
		/// </summary>
		/// <param name="fileId">Drive file/folder ID</param>
		/// <param name="role">Permission role: "reader" or "writer"</param>
		Task SetPublicPermissionAsync(string fileId, string role = "writer");

		/// <summary>
		/// Delete file from Google Drive
		/// </summary>
		/// <param name="fileId">Drive file ID</param>
		Task<bool> DeleteFileAsync(string fileId);

		/// <summary>
		/// Get file download URL
		/// </summary>
		/// <param name="fileId">Drive file ID</param>
		/// <returns>Download URL</returns>
		Task<string> GetFileDownloadUrlAsync(string fileId);
	}
}

