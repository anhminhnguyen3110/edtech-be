export function generateHtmlResponse(result: any): string {
    const resultText = typeof result === 'string' ? result : result.message || 'Error';
    const color = typeof result === 'string' ? '#57ADE0' : '#FF0000'; // Light blue for string, red for other
    const clientUrl = process.env.CLIENT_URL;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Account API Response</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f9;
          color: #333;
          text-align: center;
          padding: 50px;
        }
        h1 {
          color: ${color};
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .back-to-login {
          margin-top: 20px;
        }
        .back-to-login a {
          color: #4CAF50;
          text-decoration: none;
          font-weight: bold;
        }
        .back-to-login a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${resultText}</h1>
        <div class="back-to-login">
          <a href="${clientUrl}">Back to Login</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
