import express from "express";
import controlRouter from "./api/control";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Autokirk-Control-API" });
});

app.use("/control", controlRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Autokirk Control API running on port ${port}`);
});