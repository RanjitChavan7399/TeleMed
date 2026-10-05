const assert = require("assert");

const http = require("http");

const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(0, () => {
    const port = server.address().port;

    http.get(`http://localhost:${port}/health`, (res) => {
        let data = "";

        res.on("data", chunk => {
            data += chunk;
        });

        res.on("end", () => {
            try {
                assert.strictEqual(res.statusCode, 200);

                const response = JSON.parse(data);
                assert.strictEqual(response.status, "ok");

                console.log("? Health API test passed");
                server.close(() => process.exit(0));
            } catch (error) {
                console.error("? Health API test failed");
                console.error(error);
                server.close(() => process.exit(1));
            }
        });
    }).on("error", (error) => {
        console.error("? Test request failed");
        console.error(error);
        server.close(() => process.exit(1));
    });
});
