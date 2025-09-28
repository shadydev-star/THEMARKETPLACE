import "../../styles/orders.css";

export default function Orders() {
  return (
    <div className="orders">
      <h2>Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#1001</td>
            <td>Jane Doe</td>
            <td>$150</td>
            <td>Shipped</td>
            <td>
              <button className="action-btn edit-btn">Edit</button>
              <button className="action-btn delete-btn">Delete</button>
            </td>
          </tr>
          <tr>
            <td>#1002</td>
            <td>John Smith</td>
            <td>$320</td>
            <td>Processing</td>
            <td>
              <button className="action-btn edit-btn">Edit</button>
              <button className="action-btn delete-btn">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
