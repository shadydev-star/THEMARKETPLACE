import "../../styles/products.css";

export default function Products() {
  return (
    <div className="products">
      <h2>Products</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>iPhone 15</td>
            <td>$999</td>
            <td>12</td>
            <td>Electronics</td>
            <td>
              <button className="action-btn edit-btn">Edit</button>
              <button className="action-btn delete-btn">Delete</button>
            </td>
          </tr>
          <tr>
            <td>Running Shoes</td>
            <td>$120</td>
            <td>30</td>
            <td>Sportswear</td>
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
