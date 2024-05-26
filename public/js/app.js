const form = document.getElementById('notification');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Send the POST request using Fetch API (explained below)
});
async function sendBackgroundPost(data) {
    try {
        const response = await fetch('/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Adjust if needed
            body: JSON.stringify(data) // Convert data to JSON
        });

        if (!response.ok) {
            throw new Error(`POST request failed with status ${response.status}`);
        }

        // Handle successful response (optional)
        console.log('POST request successful!');
        // You can display a success message or perform other actions here
    } catch (error) {
        console.error('Error sending POST request:', error);
        // Handle errors appropriately (e.g., display an error message)
    }
}

form.addEventListener('submit', (event) => {
    const data = {
        // Extract data from your form fields or other sources
        uid: document.getElementById('uid').value,
        message: document.getElementById('message').value

        // ... other data fields
    };
    sendBackgroundPost(data); // Send the POST request in the background
});
