const Complains = () => {
  return (
    <div className="p-6">
      <h1 className="prefFont text-2xl font-extrabold">Complains</h1>
      <p className="mt-2 text-sm text-gray-600">
        buildi.txt: user complaints. Backend endpoint required (see REQUIRED_ENDPOINTS.md).
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <label className="text-sm font-semibold">Message</label>
        <textarea
          disabled
          className="mt-2 min-h-[120px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
          placeholder="Describe the issue…"
        />
        <button
          disabled
          className="mt-3 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Complains;
