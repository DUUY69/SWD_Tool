using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleDriveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DriveFileId",
                table: "GradeExport",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveWebViewLink",
                table: "GradeExport",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveZipFileId",
                table: "exam_zip",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveZipWebViewLink",
                table: "exam_zip",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveFolderId",
                table: "exam",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveImagesFolderId",
                table: "exam",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveOriginalExcelFileId",
                table: "exam",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveSolutionsFolderId",
                table: "exam",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveFileId",
                table: "doc_file",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriveWebViewLink",
                table: "doc_file",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DriveFileId",
                table: "GradeExport");

            migrationBuilder.DropColumn(
                name: "DriveWebViewLink",
                table: "GradeExport");

            migrationBuilder.DropColumn(
                name: "DriveZipFileId",
                table: "exam_zip");

            migrationBuilder.DropColumn(
                name: "DriveZipWebViewLink",
                table: "exam_zip");

            migrationBuilder.DropColumn(
                name: "DriveFolderId",
                table: "exam");

            migrationBuilder.DropColumn(
                name: "DriveImagesFolderId",
                table: "exam");

            migrationBuilder.DropColumn(
                name: "DriveOriginalExcelFileId",
                table: "exam");

            migrationBuilder.DropColumn(
                name: "DriveSolutionsFolderId",
                table: "exam");

            migrationBuilder.DropColumn(
                name: "DriveFileId",
                table: "doc_file");

            migrationBuilder.DropColumn(
                name: "DriveWebViewLink",
                table: "doc_file");
        }
    }
}
