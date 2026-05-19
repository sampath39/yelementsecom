import { hashPassword } from "./lib/auth";

const adminHash = hashPassword("admin123");
const vendorHash = hashPassword("vendor123");

console.log("ADMIN HASH:", adminHash);
console.log("VENDOR HASH:", vendorHash);