// Alternative file upload using Firestore instead of Storage
// Add this as a backup method in GateOfficerDashboard.jsx

const handleUploadToFirestore = async () => {
  if (!selectedFile) {
    alert("Please select a file first.");
    return;
  }

  setIsUploading(true);
  
  try {
    // Read file content
    const fileContent = await selectedFile.text();
    
    // Save directly to Firestore
    const docRef = await addDoc(collection(db, 'attendanceReports'), {
      name: selectedFile.name,
      type: reportType,
      content: fileContent, // Store file content directly
      size: selectedFile.size,
      uploadedAt: serverTimestamp(),
      uploadedBy: 'gate-officer'
    });
    
    console.log('File content saved to Firestore:', docRef.id);
    alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report uploaded successfully!`);
    setSelectedFile(null); 
    document.getElementById('file-input').value = null;
    
  } catch (error) {
    console.error("Error uploading to Firestore:", error);
    alert(`File upload failed: ${error.message}`);
  } finally {
    setIsUploading(false);
  }
};