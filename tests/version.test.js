const request = require("supertest");
const app = require("../server");

describe("GET /version.json", () => {
  it("returns the version information", async () => {
    const res = await request(app).get("/version.json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("version");
  });
});
