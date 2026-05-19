const PDFDocument = require("pdfkit");

export function generateInvoiceBuffer(order: any, user: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text("Yelements Invoice", { align: "center" });
    doc.moveDown();

    doc.text(`Order ID: #${order.id}`);
    doc.text(`Customer: ${user.name}`);
    doc.text(`Email: ${user.email}`);

    // ✅ ADDRESS
    doc.text("Address:");
    doc.text(
      `${order.shippingAddress.fullName}, ${order.shippingAddress.doorNo}`
    );
    doc.text(
      `${order.shippingAddress.street}, ${order.shippingAddress.city}`
    );
    doc.text(
      `${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
    );

    doc.moveDown();

    doc.text("Items:");
    order.items.forEach((item: any, i: number) => {
      doc.text(`${i + 1}. ${item.name} - ₹${item.price} x ${item.quantity}`);
    });

    doc.moveDown();
    doc.text(`Total: ₹${order.total}`);

    doc.end();
  });
}