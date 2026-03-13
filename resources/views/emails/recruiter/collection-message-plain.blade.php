<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edubricz Message</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f7fb;
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            color: #1f2937;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
            padding: 32px 20px;
        }
        .card {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 28px;
        }
        h1 {
            margin: 0 0 12px 0;
            font-size: 20px;
        }
        p {
            margin: 0 0 16px 0;
            line-height: 1.6;
            font-size: 14px;
        }
        .message {
            white-space: pre-wrap;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer {
            margin-top: 18px;
            font-size: 13px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Greetings from Edubricz Team</h1>
            <p>You are receiving this message because you are part of the {{ $collection->name }} collection.</p>
            <div class="message">{{ $messageBody }}</div>
            <p class="footer">Thanks,<br>Edubricz Team</p>
        </div>
    </div>
</body>
</html>
