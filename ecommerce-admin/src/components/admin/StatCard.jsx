export default function StatCard({ title, value }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
