import "../../styles/users.css";

export default function Users() {
  return (
    <div className="users">
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jane Doe</td>
            <td>jane@example.com</td>
            <td>Customer</td>
            <td>
              <button className="action-btn edit-btn">Edit</button>
              <button className="action-btn delete-btn">Delete</button>
            </td>
          </tr>
          <tr>
            <td>John Smith</td>
            <td>john@example.com</td>
            <td>Admin</td>
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
