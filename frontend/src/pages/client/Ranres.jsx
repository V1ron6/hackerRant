const Ranres = () => {
  return (
    <div className="p-6">
      <h1 className="prefFont text-2xl font-extrabold">Ranres</h1>
      <p className="mt-2 text-sm text-gray-600">
        buildi.txt: free resources (tutorials, cheat sheets, docs, drive links). Can be static first, then backed by API.
      </p>

      <div className="mt-6 space-y-3">
        <a className="block rounded-xl border border-gray-200 p-4 hover:bg-gray-50" href="https://developer.mozilla.org/" target="_blank" rel="noreferrer">
          <div className="text-sm font-semibold">MDN Web Docs</div>
          <div className="text-xs text-gray-500">Docs and references</div>
        </a>
        <a className="block rounded-xl border border-gray-200 p-4 hover:bg-gray-50" href="https://react.dev/" target="_blank" rel="noreferrer">
          <div className="text-sm font-semibold">React Docs</div>
          <div className="text-xs text-gray-500">UI library documentation</div>
        </a>
      </div>
    </div>
  );
};

export default Ranres;
