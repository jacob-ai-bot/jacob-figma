const baseUrl = "https://app.jacb.ai";
// const baseUrl = "http://localhost:3000"; // For local use

const authUrl = `${baseUrl}/auth/github?figma=1`;

export const authRedirectPageHtml = `
<!DOCTYPE HTML>
<html lang="en-US">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="0; url=${authUrl}">
        <script type="text/javascript">
            window.location.href = "${authUrl}"
        </script>
        <title>Page Redirection</title>
    </head>
    <body>
        If you are not redirected automatically, follow this <a href='${authUrl}'>link</a>.
    </body>
</html>
`;
