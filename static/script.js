let mediaRecorder;
let audioChunks = [];
let currentData = null;
let currentFilename = null;
let recordingTimer = null;
let recordingStartTime = null;

// Get all elements
const recordBusinessBtn = document.getElementById("recordBusiness");
const recordProductsBtn = document.getElementById("recordProducts");
const status1 = document.getElementById("status1");
const status2 = document.getElementById("status2");
const resultBox = document.getElementById("result");
const businessTranscription = document.getElementById("businessTranscription");
const productsTranscription = document.getElementById("productsTranscription");

// Profile management elements
const viewProfilesBtn = document.getElementById("viewProfilesBtn");
const profilesModal = document.getElementById("profilesModal");
const profilesList = document.getElementById("profilesList");
const totalProfilesCount = document.getElementById("totalProfilesCount");
const profileCount = document.querySelector(".profile-count");

// Audio visualization elements
const audioVisualization1 = document.getElementById("audioVisualization1");
const audioVisualization2 = document.getElementById("audioVisualization2");

// Transcription and data display elements
const businessTranscriptionBox = document.querySelector('#businessTranscription').closest('.transcription-box');
const productsTranscriptionBox = document.querySelector('#productsTranscription').closest('.transcription-box');
const finalDataCard = document.querySelector('h2 i.fa-file-alt').closest('.card');

// Card elements
const dataCard = document.getElementById("dataCard");
const redoBtn = document.getElementById("redoBtn");
const confirmBtn = document.getElementById("confirmBtn");

// Edit form elements
const editBusinessBtn = document.getElementById("editBusinessBtn");
const editProductsBtn = document.getElementById("editProductsBtn");
const editForm = document.getElementById("editForm");
const viewMode = document.getElementById("viewMode");
const saveChangesBtn = document.getElementById("saveChanges");
const cancelEditBtn = document.getElementById("cancelEdit");
const addProductBtn = document.getElementById("addProduct");
const productsContainer = document.getElementById("productsContainer");
const businessEditSection = document.getElementById("businessEditSection");
const productsEditSection = document.getElementById("productsEditSection");

// Helper function to update status with classes
function updateStatus(element, text, statusType = "idle") {
    element.textContent = text;
    element.className = "status";
    element.classList.add(statusType);
}

// Function to show/hide sections
function toggleSections(showBusinessTranscription = false, showProductsTranscription = false, showFinalData = false) {
    if (businessTranscriptionBox) {
        businessTranscriptionBox.style.display = showBusinessTranscription ? 'block' : 'none';
    }
    if (productsTranscriptionBox) {
        productsTranscriptionBox.style.display = showProductsTranscription ? 'block' : 'none';
    }
    if (finalDataCard) {
        finalDataCard.style.display = showFinalData ? 'block' : 'none';
    }
}

// Initially hide transcription and final data sections
toggleSections(false, false, false);

// Show loading spinner in button
function showButtonLoading(button, isLoading) {
    if (isLoading) {
        button.innerHTML = '<span class="loading-spinner"></span>';
        button.disabled = true;
    } else {
        button.disabled = false;
        // Restore original button icon
        if (button.id === "recordBusiness") {
            button.innerHTML = '<i class="fas fa-microphone"></i>';
        } else if (button.id === "recordProducts") {
            button.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

// Start Recording
async function startRecording(endpoint, statusElement, button) {
    audioChunks = [];
    recordingStartTime = Date.now();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.start();
        updateStatus(statusElement, " Recording... Click again to stop", "recording");
        button.innerHTML = '<i class="fas fa-stop"></i>';
        button.classList.add("recording");
        
        // Show audio visualization
        if (endpoint === "/upload_business_audio") {
            audioVisualization1.style.display = "block";
        } else if (endpoint === "/upload_product_audio") {
            audioVisualization2.style.display = "block";
        }
        
        // Start recording timer
        startRecordingTimer(statusElement);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            stopRecordingTimer();
            updateStatus(statusElement, " Uploading & Processing...", "processing");
            showButtonLoading(button, true);
            
            // Hide audio visualization
            if (endpoint === "/upload_business_audio") {
                audioVisualization1.style.display = "none";
            } else if (endpoint === "/upload_product_audio") {
                audioVisualization2.style.display = "none";
            }
            
            // Remove recording class
            button.classList.remove("recording");

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", audioBlob);

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const responseData = await response.json();
                
                if (responseData.error) {
                    throw new Error(responseData.error);
                }

                currentData = responseData.data;
                currentFilename = responseData.filename;
                
                // Update display based on data availability
                updateDataDisplay();
                
                // Display transcription in the appropriate box
                if (endpoint === "/upload_business_audio") {
                    businessTranscription.textContent = responseData.transcription || "No transcription available";
                } else if (endpoint === "/upload_product_audio") {
                    productsTranscription.textContent = responseData.transcription || "No transcription available";
                }
                
                // Show transcription and final data sections after recording
                if (endpoint === "/upload_business_audio") {
                    toggleSections(true, false, true);
                } else if (endpoint === "/upload_product_audio") {
                    toggleSections(false, true, true);
                }
                
                // Show appropriate edit buttons based on phase
                if (endpoint === "/upload_business_audio") {
                    editBusinessBtn.style.display = "inline-block";
                    // Keep Edit Products button visible if products exist
                    if (currentData && currentData.products && currentData.products.length > 0) {
                        editProductsBtn.style.display = "inline-block";
                    } else {
                        editProductsBtn.style.display = "none";
                    }
                } else if (endpoint === "/upload_product_audio") {
                    editBusinessBtn.style.display = "inline-block";
                    editProductsBtn.style.display = "inline-block";
                }

                updateStatus(statusElement, " Completed!", "completed");
                
                // Add fade-in effect
                if (dataCard.style.display !== "none") {
                    dataCard.classList.add('fade-in');
                } else {
                    resultBox.parentElement.classList.add('fade-in');
                }
                
            } catch (err) {
                console.error("Error:", err);
                updateStatus(statusElement, ` Error: ${err.message}`, "error");
                showButtonLoading(button, false);
                
                // Hide audio visualization on error
                if (endpoint === "/upload_business_audio") {
                    audioVisualization1.style.display = "none";
                } else if (endpoint === "/upload_product_audio") {
                    audioVisualization2.style.display = "none";
                }
                
                // Remove recording class
                button.classList.remove("recording");
            }
        };
    } catch (err) {
        console.error("Microphone error:", err);
        updateStatus(statusElement, `❌ Microphone access denied: ${err.message}`, "error");
        
        // Hide audio visualization on microphone error
        if (endpoint === "/upload_business_audio") {
            audioVisualization1.style.display = "none";
        } else if (endpoint === "/upload_product_audio") {
            audioVisualization2.style.display = "none";
        }
        
        // Remove recording class
        button.classList.remove("recording");
    }
}

// Recording timer functions
function startRecordingTimer(statusElement) {
    recordingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `🎙️ Recording... ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Click to stop`;
        updateStatus(statusElement, timeString, "recording");
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// 🔁 Toggle recording
function toggleRecording(endpoint, statusElement, button) {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    } else {
        startRecording(endpoint, statusElement, button);
    }
}

// Set up event listeners
recordBusinessBtn.onclick = () =>
    toggleRecording("/upload_business_audio", status1, recordBusinessBtn);

recordProductsBtn.onclick = () =>
    toggleRecording("/upload_product_audio", status2, recordProductsBtn);

// 📊 Card Display Functions
function updateDataDisplay() {
    if (!currentData) {
        dataCard.style.display = "none";
        resultBox.style.display = "block";
        resultBox.textContent = "No data yet... Complete Phase 1 and/or Phase 2 to see extracted information here.";
        return;
    }
    
    // Show card and hide raw JSON
    dataCard.style.display = "block";
    resultBox.style.display = "none";
    
    // Populate card fields with data and confidence levels
    updateCardField("cardPersonName", currentData.personName, getConfidenceLevel(currentData.personName));
    updateCardField("cardName", currentData.name, getConfidenceLevel(currentData.name));
    updateCardField("cardAddress", currentData.address, getConfidenceLevel(currentData.address));
    updateCardField("cardCity", currentData.city, getConfidenceLevel(currentData.city));
    updateCardField("cardCategory", currentData.category, getConfidenceLevel(currentData.category));
    updateCardField("cardSubcategory", currentData.subcategory, getConfidenceLevel(currentData.subcategory));
    updateCardField("cardPhone", currentData.phone, getConfidenceLevel(currentData.phone));
    
    // Handle products display
    if (currentData.products && currentData.products.length > 0) {
        const productNames = currentData.products.map(p => p.name).filter(n => n).join(", ");
        updateCardField("cardProducts", productNames || "No products", getConfidenceLevel(productNames));
    } else {
        updateCardField("cardProducts", "No products", "low");
    }
    
    // Email field removed from display
}

function updateCardField(fieldId, value, confidence) {
    const valueElement = document.getElementById(fieldId);
    const confidenceElement = document.getElementById(fieldId + "Confidence");
    
    if (valueElement) {
        valueElement.textContent = value || "-";
    }
    
    if (confidenceElement) {
        confidenceElement.textContent = confidence || "-";
        confidenceElement.className = "confidence-badge confidence-" + (confidence === "High" ? "high" : confidence === "Med" ? "medium" : "low");
    }
}

function getConfidenceLevel(value) {
    if (!value || value === "-" || value === "Not provided" || value === "No products") {
        return "Low";
    }
    
    // Simple heuristic based on value quality
    if (typeof value === 'string') {
        if (value.length > 10 && !value.includes("Not provided")) {
            return "High";
        } else if (value.length > 3) {
            return "Med";
        }
    }
    
    return "Med";
}

function enterCardEditMode() {
    // Open JSON editor modal instead of business edit mode
    if (!currentData) {
        alert("No data available to edit!");
        return;
    }
    
    // Populate JSON editor with current data
    // jsonEditor.value = JSON.stringify(currentData, null, 2);
    // jsonEditorModal.style.display = "flex";
    
    // Focus the editor
    // setTimeout(() => {
    //     jsonEditor.focus();
    //     jsonEditor.select();
    // }, 100);
}

function handleRedo() {
    if (confirm("Are you sure you want to redo the extraction? This will clear all current data.")) {
        currentData = null;
        currentFilename = null;
        updateDataDisplay();
        
        // Reset transcriptions
        businessTranscription.textContent = "No transcription yet...";
        productsTranscription.textContent = "No transcription yet...";
        
        // Hide transcription and final data sections
        toggleSections(false, false, false);
        
        // Hide edit buttons
        editBusinessBtn.style.display = "none";
        
        // Reset status
        updateStatus(status1, "Idle - Ready to record business information", "idle");
    }
}

function handleConfirm() {
    if (!currentData) {
        alert("No data to confirm!");
        return;
    }
        
    // Populate the success modal with profile details
    populateSuccessModal();
        
    // Show the success modal
    const modal = document.getElementById("successModal");
    modal.style.display = "flex";
        
    // Add fade-in animation
    setTimeout(() => {
        modal.classList.add('fade-in');
    }, 10);
}

// Edit Mode Functions
function enterBusinessEditMode() {
    if (!currentData) {
        alert("No data available to edit!");
        return;
    }
    
    viewMode.style.display = "none";
    editForm.style.display = "block";
    businessEditSection.style.display = "block";
    
    // Populate business fields
    document.getElementById("editPersonName").value = currentData.personName || "";
    document.getElementById("editName").value = currentData.name || "";
    document.getElementById("editAddress").value = currentData.address || "";
    document.getElementById("editCity").value = currentData.city || "";
    document.getElementById("editCategory").value = currentData.category || "";
    document.getElementById("editSubcategory").value = currentData.subcategory || "";
    document.getElementById("editPhone").value = currentData.phone || "";
    
    // Add animation
    editForm.classList.add('fade-in');
}

async function saveChanges() {
    console.log("Save changes clicked");
    console.log("Current data:", currentData);
    console.log("Current filename:", currentFilename);
    
    // Check if we have data to save
    if (!currentData) {
        alert("❌ No data to save!");
        return;
    }
    
    // If no filename, create a new one
    if (!currentFilename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        currentFilename = `session_${timestamp}.json`;
        console.log("Created new filename:", currentFilename);
    }
    
    // Show loading state
    saveChangesBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    saveChangesBtn.disabled = true;
    
    try {
        console.log("Sending save request to server...");
        const response = await fetch("/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                filename: currentFilename,
                data: currentData
            })
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Server response:", result);
        
        if (result.success) {
            updateDataDisplay();
            exitEditModeWithoutConfirmation();
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> ✅ All changes saved successfully!';
            document.querySelector('.card:last-child').prepend(successMsg);
            
            // Auto-remove success message after 3 seconds
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.remove();
                }
            }, 3000);
        } else {
            alert("❌ Error saving changes: " + (result.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Save error:", err);
        alert("❌ Error saving changes: " + err.message);
    } finally {
        // Restore button
        saveChangesBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        saveChangesBtn.disabled = false;
    }
}

function exitEditMode() {
    if (confirm("Are you sure you want to exit without saving changes?")) {
        editForm.style.display = "none";
        viewMode.style.display = "block";
    }
}

function exitEditModeWithoutConfirmation() {
    editForm.style.display = "none";
    viewMode.style.display = "block";
}

// Success Modal Functions
function populateSuccessModal() {
    if (!currentData) return;
    
    // Populate the summary fields with current data
    document.getElementById("summaryPersonName").textContent = currentData.personName || "-";
    document.getElementById("summaryName").textContent = currentData.name || "-";
    document.getElementById("summaryAddress").textContent = currentData.address || "-";
    document.getElementById("summaryCity").textContent = currentData.city || "-";
    document.getElementById("summaryCategory").textContent = currentData.category || "-";
    document.getElementById("summaryPhone").textContent = currentData.phone || "-";
    
    // Handle products display
    if (currentData.products && currentData.products.length > 0) {
        const productNames = currentData.products.map(p => p.name).filter(n => n).join(", ");
        document.getElementById("summaryProducts").textContent = productNames || "No products";
    } else {
        document.getElementById("summaryProducts").textContent = "No products";
    }
}

function closeSuccessModal() {
    const modal = document.getElementById("successModal");
    modal.classList.remove('fade-in');
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
}

function createMoreProfiles() {
    // Close the success modal
    closeSuccessModal();
    
    // Reset all data and UI to start fresh
    currentData = null;
    currentFilename = null;
    updateDataDisplay();
    
    // Reset transcriptions
    businessTranscription.textContent = "No transcription yet...";
    productsTranscription.textContent = "No transcription yet...";
    
    // Hide transcription and final data sections
    toggleSections(false, false, false);
    
    // Hide edit buttons
    editBusinessBtn.style.display = "none";
    editProductsBtn.style.display = "none";
    
    // Reset status messages
    updateStatus(status1, "Idle - Ready to record business information", "idle");
    updateStatus(status2, "Idle - Ready to record product information", "idle");
    
    // Show success message for creating new profile
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = '<i class="fas fa-plus-circle"></i> Ready to create a new profile! Start with Phase 1.';
    document.querySelector('.container').insertBefore(successMsg, document.querySelector('.card'));
    
    // Auto-remove success message after 3 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.remove();
        }
    }, 3000);
}

function finishProcess() {
    // Close the success modal
    closeSuccessModal();
    
    // Show final completion message
    const completionMsg = document.createElement('div');
    completionMsg.className = 'completion-message';
    completionMsg.innerHTML = '<i class="fas fa-check-double"></i> Thank you! All profiles have been created successfully.';
    document.querySelector('.container').insertBefore(completionMsg, document.querySelector('.card'));
    
    // Reset everything after a delay
    setTimeout(() => {
        if (completionMsg.parentNode) {
            completionMsg.remove();
        }
        createMoreProfiles(); // Reset for potential new use
    }, 5000);
}

function enterProductsEditMode() {
    if (!currentData) {
        alert("No data available to edit!");
        return;
    }
    
    viewMode.style.display = "none";
    editForm.style.display = "block";
    productsEditSection.style.display = "block";
    
    // Display current products
    displayProducts();
    
    // Add animation
    editForm.classList.add('fade-in');
}

// Product Management Functions
function displayProducts() {
    if (!currentData.products || currentData.products.length === 0) {
        productsContainer.innerHTML = '<p>No products yet. Record product information or add manually!</p>';
        return;
    }
    
    productsContainer.innerHTML = '';
    currentData.products.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item';
        productDiv.innerHTML = `
            <div class="product-header">
                <h4>Product ${index + 1}</h4>
                <div class="product-actions">
                    <button class="edit-btn" onclick="editProduct(${index})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="remove-btn" onclick="removeProduct(${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
            <div class="product-fields">
                <input type="text" class="product-input" placeholder="Product name" 
                       value="${product.name || ''}" data-field="name" data-index="${index}">
                <input type="text" class="product-input" placeholder="Unit" 
                       value="${product.unit || ''}" data-field="unit" data-index="${index}">
                <input type="number" class="product-input" placeholder="Price" 
                       value="${product.price || 0}" data-field="price" data-index="${index}">
            </div>
        `;
        productsContainer.appendChild(productDiv);
    });
    
    // Add event listeners to product inputs
    document.querySelectorAll('.product-input').forEach(input => {
        input.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            const field = this.dataset.field;
            const value = this.value;
            updateProductFromInput(index, field, value);
        });
    });
}

function editProduct(index) {
    const product = currentData.products[index];
    if (!product) return;
    
    // Create edit modal or inline editing
    const productDiv = document.querySelector(`.product-item:nth-child(${index + 1})`);
    const fieldsDiv = productDiv.querySelector('.product-fields');
    
    // Convert to edit mode
    fieldsDiv.innerHTML = `
        <input type="text" class="product-input" placeholder="Product name" 
               value="${product.name}" data-field="name" data-index="${index}">
        <input type="text" class="product-input" placeholder="Unit" 
               value="${product.unit}" data-field="unit" data-index="${index}">
        <input type="number" class="product-input" placeholder="Price" 
               value="${product.price}" data-field="price" data-index="${index}">
        <div class="product-actions">
            <button class="save-btn" onclick="saveProduct(${index})">
                <i class="fas fa-save"></i> Save
            </button>
            <button class="cancel-btn" onclick="cancelEditProduct(${index})">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    // Re-attach event listeners to the new inputs
    document.querySelectorAll('.product-input').forEach(input => {
        input.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            const field = this.dataset.field;
            const value = this.value;
            updateProductFromInput(index, field, value);
        });
    });
}

function saveProduct(index) {
    const nameInput = document.querySelector(`input[data-field="name"][data-index="${index}"]`);
    const unitInput = document.querySelector(`input[data-field="unit"][data-index="${index}"]`);
    const priceInput = document.querySelector(`input[data-field="price"][data-index="${index}"]`);
    
    // Update product data
    currentData.products[index] = {
        name: nameInput.value.trim(),
        unit: unitInput.value.trim(),
        price: parseFloat(priceInput.value) || 0
    };
    
    // Switch back to display mode
    displayProducts();
    
    // Show success message
    showSuccessMessage(`Product ${index + 1} updated successfully!`);
}

function cancelEditProduct(index) {
    // Just refresh display to cancel edit mode
    displayProducts();
}

function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    productsContainer.parentElement.insertBefore(successMsg, productsContainer);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.remove();
        }
    }, 3000);
}

function addProduct() {
    if (!currentData.products) {
        currentData.products = [];
    }
    
    currentData.products.push({
        name: "",
        unit: "",
        price: 0
    });
    
    displayProducts();
}

function removeProduct(index) {
    if (confirm("Are you sure you want to remove this product?")) {
        currentData.products.splice(index, 1);
        displayProducts();
    }
}

function updateProductFromInput(index, field, value) {
    if (!currentData.products[index]) {
        currentData.products[index] = {};
    }
    
    if (field === 'price') {
        currentData.products[index][field] = parseFloat(value) || 0;
    } else {
        currentData.products[index][field] = value;
    }
}

// Event Listeners
editBusinessBtn.addEventListener("click", enterBusinessEditMode);
redoBtn.addEventListener("click", handleRedo);
confirmBtn.addEventListener("click", handleConfirm);
cancelEditBtn.addEventListener("click", exitEditMode);
saveChangesBtn.addEventListener("click", saveChanges);
editProductsBtn.addEventListener("click", enterProductsEditMode);
addProductBtn.addEventListener("click", addProduct);
viewProfilesBtn.addEventListener("click", openProfilesModal);

// Add keyboard shortcut support
document.addEventListener('keydown', function(e) {
    // ESC key to cancel edit mode
    if (e.key === 'Escape' && editForm.style.display === 'block') {
        exitEditMode();
    }
});

// Initialize tooltips if needed
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code here if needed
    updateProfileCount();
});

// Profile Management Functions
function updateProfileCount() {
    // Load profiles from server and update count
    loadProfiles();
}

async function loadProfiles() {
    try {
        const response = await fetch('/get_sessions');
        if (!response.ok) {
            throw new Error(`Failed to load profiles: ${response.status}`);
        }
        
        const profiles = await response.json();
        displayProfiles(profiles);
        updateProfileCountDisplay(profiles.length);
    } catch (error) {
        console.error('Error loading profiles:', error);
        profilesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load profiles: ${error.message}</p>
            </div>
        `;
    }
}

function displayProfiles(profiles) {
    if (!profiles || profiles.length === 0) {
        profilesList.innerHTML = `
            <div class="no-profiles">
                <i class="fas fa-users-slash"></i>
                <p>No profiles created yet. Start by recording business information!</p>
            </div>
        `;
        return;
    }

    profilesList.innerHTML = '';
    profiles.forEach((profile, index) => {
        const profileCard = createProfileCard(profile, index);
        profilesList.appendChild(profileCard);
    });
}

function createProfileCard(profile, index) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    
    // Format date from filename
    const dateStr = profile.filename || 'Unknown date';
    const formattedDate = dateStr.replace(/session_(\d{8})_(\d{6})\.json/, (match, p1, p2) => {
        const date = new Date(p1.substring(0, 4) + '-' + p1.substring(4, 6) + '-' + p1.substring(6, 8));
        return date.toLocaleDateString() + ' ' + p2.substring(0, 2) + ':' + p2.substring(2, 4);
    });
    
    // Get product names
    const productNames = profile.data && profile.data.products 
        ? profile.data.products.map(p => p.name).filter(n => n).join(', ')
        : 'No products';
    
    card.innerHTML = `
        <div class="profile-card-header">
            <h3 class="profile-title">${profile.data?.name || 'Untitled Business'}</h3>
            <span class="profile-date">${formattedDate}</span>
        </div>
        <div class="profile-info">
            <div class="profile-info-item">
                <label class="profile-info-label">Person Name:</label>
                <span class="profile-info-value">${profile.data?.personName || '-'}</span>
            </div>
            <div class="profile-info-item">
                <label class="profile-info-label">Business Name:</label>
                <span class="profile-info-value">${profile.data?.name || '-'}</span>
            </div>
            <div class="profile-info-item">
                <label class="profile-info-label">City:</label>
                <span class="profile-info-value">${profile.data?.city || '-'}</span>
            </div>
            <div class="profile-info-item">
                <label class="profile-info-label">Category:</label>
                <span class="profile-info-value">${profile.data?.category || '-'}</span>
            </div>
            <div class="profile-info-item">
                <label class="profile-info-label">Phone:</label>
                <span class="profile-info-value">${profile.data?.phone || '-'}</span>
            </div>
            <div class="profile-info-item">
                <label class="profile-info-label">Products:</label>
                <span class="profile-info-value">${productNames}</span>
            </div>
        </div>
        <div class="profile-actions">
            <button class="load-profile-btn" onclick="loadProfile('${profile.filename}')">
                <i class="fas fa-folder-open"></i> Load Profile
            </button>
            <button class="delete-profile-btn" onclick="deleteProfile('${profile.filename}', ${index})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

function updateProfileCountDisplay(count) {
    if (profileCount) {
        profileCount.textContent = count;
    }
    if (totalProfilesCount) {
        totalProfilesCount.textContent = count;
    }
}

async function loadProfile(filename) {
    try {
        const response = await fetch(`/get_session/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load profile: ${response.status}`);
        }
        
        const profileData = await response.json();
        
        // Set current data and filename
        currentData = profileData;
        currentFilename = filename;
        
        // Update the display
        updateDataDisplay();
        
        // Show the data card
        dataCard.style.display = "block";
        resultBox.style.display = "none";
        
        // Show edit buttons
        editBusinessBtn.style.display = "inline-block";
        if (profileData.products && profileData.products.length > 0) {
            editProductsBtn.style.display = "inline-block";
        }
        
        // Show transcription sections
        toggleSections(true, true, true);
        
        // Close the profiles modal
        closeProfilesModal();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i> Profile "${profileData.name || 'Untitled'}" loaded successfully!`;
        document.querySelector('.container').insertBefore(successMsg, document.querySelector('.card'));
        
        // Auto-remove success message after 3 seconds
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert(`Failed to load profile: ${error.message}`);
    }
}

async function deleteProfile(filename, index) {
    if (!confirm(`Are you sure you want to delete this profile? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_session/${filename}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete profile: ${response.status}`);
        }
        
        // Reload profiles list
        await loadProfiles();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = `<i class="fas fa-trash"></i> Profile deleted successfully!`;
        profilesList.parentElement.insertBefore(successMsg, profilesList);
        
        // Auto-remove success message after 3 seconds
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error deleting profile:', error);
        alert(`Failed to delete profile: ${error.message}`);
    }
}

function openProfilesModal() {
    profilesModal.style.display = "flex";
    setTimeout(() => {
        profilesModal.classList.add('fade-in');
    }, 10);
    loadProfiles();
}

function closeProfilesModal() {
    profilesModal.classList.remove('fade-in');
    setTimeout(() => {
        profilesModal.style.display = "none";
    }, 300);
}