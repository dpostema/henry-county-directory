const targetUrl = 'https://api.resend.com/emails';
const apiKey = 're_cTQ8ZR72_8QXdtiJMNxbumXjb8W2V5wGX';

async function testResend() {
  try {
    console.log("Sending test email with Resend...");
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'marketing@mail.henrycodirectory.online',
        to: 'delivered@resend.dev',
        subject: 'Test from Henry County Directory',
        html: '<p>This is a test.</p>'
      })
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", data);
  } catch (error) {
    console.error("Error testing Resend:", error);
  }
}

testResend();
