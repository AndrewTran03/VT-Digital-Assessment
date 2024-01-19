import express from "express";

const router = express.Router();

router.get("/api/example", (_, res) => {
    return res.status(200).send({ data: "Example GET request at /api/example\n" });
});

// 201 = Successful Resource Creation
router.post("/api/example", (_, res) => {
    return res.status(201).send({ data: "Example POST request at /api/example\n" });
});

export { router as exampleRouter };
