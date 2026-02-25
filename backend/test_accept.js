const fetch = require('node-fetch'); // Assuming node-fetch is not needed if node 18+, let's use standard URL or http if needed, but fetch is global in node 18+.

async function testAccept() {
    try {
        const res = await fetch('http://localhost:5000/api/orders/admin/1/accept', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminNote: "Test Note" })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Fetch threw:", err);
    }
}
testAccept();
