import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import ordersRouter from "./routes/orders";
import addressesRouter from "./routes/addresses";
import couponsRouter from "./routes/coupons";
import referralsRouter from "./routes/referrals";
import rewardsRouter from "./routes/rewards";
import notificationsRouter from "./routes/notifications";



const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", ordersRouter);
app.use("/api/addresses", addressesRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/notifications", notificationsRouter);

app.use("/api", router);

export default app;
