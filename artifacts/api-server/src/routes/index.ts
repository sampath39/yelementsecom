import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import reviewsRouter from "./reviews";
import usersRouter from "./users";
import adminRouter from "./admin";
import vendorsRouter from "./vendors";
import paymentRoutes from "./payment";
import razorpayRoutes from "./razorpay";





const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(reviewsRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(vendorsRouter);
router.use("/razorpay", razorpayRoutes);
router.use("/payment", paymentRoutes);
export default router;

