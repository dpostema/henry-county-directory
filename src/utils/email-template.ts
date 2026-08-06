export function generateEmailHtml(title: string, contentHtml: string): string {
  const brandColor = "#E8505B";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: ${brandColor};
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .body {
      padding: 40px 30px;
      color: #334155;
      font-size: 16px;
      line-height: 1.6;
    }
    .body h3 {
      color: #0f172a;
      margin-top: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .body p {
      margin: 0 0 16px 0;
    }
    .body strong {
      color: #0f172a;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background-color: ${brandColor};
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 10px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    .box {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid ${brandColor};
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Henry County Directory. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
}
