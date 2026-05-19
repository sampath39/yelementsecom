import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Track() {
  const [location] = useLocation();
  const [order, setOrder] = useState<any>(null);

  const id = new URLSearchParams(location.split("?")[1]).get("id");

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${apiUrl}/api/orders`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((o: any) => o.id == id);
        setOrder(found);
      });
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2>Tracking Order #{order.id}</h2>
      <p>Status: {order.status}</p>

      <div className="mt-4">
        {["pending","packed","shipped","delivered","completed"].map((s) => (
          <div key={s}>
            {s === order.status ? "👉 " : ""}{s}
          </div>
        ))}
      </div>
    </div>
  );
}