const RantFinder = () => {
  return (
    <div className="p-6">
      <h1 className="prefFont text-2xl font-extrabold">RantFinder</h1>
      <p className="mt-2 text-sm text-gray-600">
        buildi.txt: discover users by location + search by username. Backend endpoints required (see REQUIRED_ENDPOINTS.md).
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold">Search by username</div>
          <input
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
            placeholder="Search @username"
            disabled
          />
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold">Nearby suggestions</div>
          <div className="mt-3 text-sm text-gray-600">
            Requires location permissions + discovery endpoint.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RantFinder;
