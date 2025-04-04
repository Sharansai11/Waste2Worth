import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { bulkRegisterVolunteers } from "../../services/authService";
import { Form, Button, Container, Card, Alert, Table } from "react-bootstrap";
import * as XLSX from "xlsx";
import { BsFileEarmarkExcel, BsUpload, BsCheckCircle, BsExclamationTriangle, BsDownload,BsTable } from "react-icons/bs";

const BulkUploadVolunteers = () => {
  const { user, role, ngoName } = useAuth();
  const [file, setFile] = useState(null);
  const [volunteerData, setVolunteerData] = useState([]);
  const [uploadResult, setUploadResult] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleParseFile = () => {
    if (!file) {
      setError("Please select an Excel file to upload.");
      return;
    }
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });
        if (!jsonData.length) {
          setError("The file is empty or has incorrect data.");
          return;
        }
        const formattedVolunteers = jsonData.map((row) => ({
          name: row.Name?.trim() || "",
          email: row.Email?.trim() || "",
          password: row.Password?.trim() || "",
          contact: row.Contact?.toString().trim() || "",
          address: row.Address?.trim() || "",
          lat: row.Latitude ? parseFloat(row.Latitude) : null,
          lng: row.Longitude ? parseFloat(row.Longitude) : null,
        }));
        if (formattedVolunteers.some((v) => !v.name || !v.email || !v.password)) {
          setError("Some rows are missing 'Name', 'Email', or 'Password' fields.");
          return;
        }
        setVolunteerData(formattedVolunteers);
        setSuccessMessage("✅ File parsed successfully! Ready to register volunteers.");
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("Error reading the file. Ensure it's a valid .xlsx or .csv format.");
    }
  };
// Function to generate a sample CSV for download
const generateSampleCSV = () => {
  const sampleData = [
    ["Name", "Email", "Password", "Contact", "Latitude", "Longitude"],
    ["John Doe", "johndoe@example.com", "password123", "1234567890", "12.9716", "77.5946"],
    ["Jane Smith", "janesmith@example.com", "password456", "0987654321",  "19.0760", "72.8777"]
  ];
  const csvContent = sampleData.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sample_volunteer_data.csv";
  link.click();
};
  const handleUpload = async () => {
    if (!volunteerData.length) {
      setError("No valid volunteers to register. Please upload and parse a file first.");
      return;
    }
    try {
      setError("");
      setSuccessMessage("Uploading volunteers... Please wait.");
      const ngoPassword = prompt("Enter your NGO password to confirm bulk registration:");
      if (!ngoPassword) {
        setError("NGO password is required to proceed.");
        return;
      }
      const result = await bulkRegisterVolunteers(volunteerData, user.uid, ngoName, user.email, ngoPassword);
      setUploadResult(result);
      setSuccessMessage("✅ Volunteers registered successfully!");
      setVolunteerData([]);
    } catch (error) {
      setError("❌ Failed to upload volunteers. Please try again.");
      console.error("❌ Upload error:", error);
    }
  };

  return  (
    <Container className="mt-5">
      <Card className="p-4 shadow-lg">
        <h3 className="text-center mb-4">
          <BsFileEarmarkExcel className="me-2 text-success" /> Bulk Upload Volunteers
        </h3>
        {error && <Alert variant="danger"><BsExclamationTriangle className="me-2" /> {error}</Alert>}
        {successMessage && <Alert variant="success"><BsCheckCircle className="me-2" /> {successMessage}</Alert>}
        
        <div className="d-flex justify-content-center gap-3">
          <Button variant="info" onClick={generateSampleCSV}>
            <BsDownload className="me-2" /> Download Sample CSV
          </Button>
        </div>

        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Select Excel File (.xlsx or .csv)</Form.Label>
          <Form.Control type="file" accept=".xlsx,.csv" onChange={handleFileChange} />
        </Form.Group>
        
        <div className="d-flex justify-content-center gap-3">
          <Button variant="secondary" onClick={handleParseFile}>
            <BsTable className="me-2" /> Parse File
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={!volunteerData.length}>
            <BsUpload className="me-2" /> Upload & Register Volunteers
          </Button>
        </div>
        
        {volunteerData.length > 0 && (
          <div className="mt-4">
            <h5><BsTable className="me-2" /> Parsed Volunteer Data:</h5>
            <Table striped bordered hover>
              <thead className="table-dark text-center">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Password</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {volunteerData.map((volunteer, index) => (
                  <tr key={index}>
                    <td>{volunteer.name}</td>
                    <td>{volunteer.email}</td>
                    <td>{volunteer.password}</td>
                    <td>{volunteer.contact || "N/A"}</td>
                    <td>{volunteer.address || "N/A"}</td>
                    <td>{volunteer.lat || "N/A"}</td>
                    <td>{volunteer.lng || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default BulkUploadVolunteers;