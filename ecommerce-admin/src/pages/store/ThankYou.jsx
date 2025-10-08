import { Link, useParams } from "react-router-dom";
import "../../styles/store.css";

export default function ThankYou() {
  const { slug } = useParams();

  return (
    <div className="thankyou-page">
      <h2>🎉 Thank You for Your Order!</h2>
      <p>Your order has been received and is being processed.</p>
      <Link to={`/store/${slug}`} className="btn">
        Back to Store
      </Link>
    </div>
  );
}
